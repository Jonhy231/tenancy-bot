import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    MessageFlags 
} from "discord.js";
import Ticket from "../../database/models/Ticket.js";
import { getGuildConfig } from "../../database/cache.js";
import { t } from "../utils/i18n.js";

export const data = new SlashCommandBuilder()
    .setName("add")
    .setDescription("Agrega a un usuario al ticket actual")
    .addUserOption(option => 
        option.setName("usuario")
            .setDescription("El usuario que deseas agregar")
            .setRequired(true)
    );

export async function execute(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";
    const targetUser = interaction.options.getMember("usuario");

    // 1. Verificar si estamos en un canal de ticket
    const ticket = await Ticket.findOne({
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        status: "open"
    });

    if (!ticket) {
        return interaction.reply({
            content: t(lang, "TICKET_NOT_ACTIVE"),
            flags: [MessageFlags.Ephemeral]
        });
    }

    // 2. Verificar permisos (Solo staff puede agregar gente)
    const isStaff = interaction.member.roles.cache.some(r => 
        guildConfig.supportRoles.includes(r.id) || 
        guildConfig.adminRoles.includes(r.id)
    ) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
        return interaction.reply({
            content: t(lang, "TICKET_ONLY_STAFF_ADD"),
            flags: [MessageFlags.Ephemeral]
        });
    }

    try {
        // 3. Actualizar permisos del canal
        await interaction.channel.permissionOverwrites.edit(targetUser.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true
        });

        // 4. Actualizar base de datos
        if (!ticket.addedUsers.includes(targetUser.id)) {
            await Ticket.updateOne(
                { _id: ticket._id },
                { $push: { addedUsers: targetUser.id } }
            );
        }

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`✅ **${targetUser.user.username}** ha sido agregado al ticket.`)
            .setFooter({ text: `Acción por ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error("❌ Error en comando /add:", error);
        return interaction.reply({
            content: "❌ Hubo un error al intentar agregar al usuario al canal. Verifica que el bot tenga permisos suficientes.",
            flags: [MessageFlags.Ephemeral]
        });
    }
}
