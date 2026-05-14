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
    .setName("remove")
    .setDescription("Elimina a un usuario del ticket actual")
    .addUserOption(option => 
        option.setName("usuario")
            .setDescription("El usuario que deseas eliminar")
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

    // 2. Verificar permisos (Solo staff puede eliminar gente)
    const isStaff = interaction.member.roles.cache.some(r => 
        guildConfig.supportRoles.includes(r.id) || 
        guildConfig.adminRoles.includes(r.id)
    ) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
        return interaction.reply({
            content: "❌ Solo el personal del servidor puede eliminar usuarios del ticket.",
            flags: [MessageFlags.Ephemeral]
        });
    }

    // 3. No permitir eliminarse a sí mismo o al creador del ticket (a menos que sea admin)
    if (targetUser.id === ticket.userId) {
        return interaction.reply({
            content: "❌ No puedes eliminar al dueño del ticket.",
            flags: [MessageFlags.Ephemeral]
        });
    }

    try {
        // 4. Eliminar permisos del canal
        await interaction.channel.permissionOverwrites.delete(targetUser.id);

        // 5. Actualizar base de datos
        await Ticket.updateOne(
            { _id: ticket._id },
            { $pull: { addedUsers: targetUser.id } }
        );

        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription(`✅ **${targetUser.user.username}** ha sido eliminado del ticket.`)
            .setFooter({ text: `Acción por ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error("❌ Error en comando /remove:", error);
        return interaction.reply({
            content: "❌ Hubo un error al intentar eliminar al usuario del canal.",
            flags: [MessageFlags.Ephemeral]
        });
    }
}
