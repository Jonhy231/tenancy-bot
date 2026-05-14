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
    .setName("rename")
    .setDescription("Cambia el nombre del canal de ticket actual")
    .addStringOption(option => 
        option.setName("nombre")
            .setDescription("El nuevo nombre para el canal")
            .setRequired(true)
            .setMaxLength(100)
    );

export async function execute(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";
    const newName = interaction.options.getString("nombre").replace(/\s+/g, "-").toLowerCase();

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

    // 2. Verificar permisos (Solo staff)
    const isStaff = interaction.member.roles.cache.some(r => 
        guildConfig.supportRoles.includes(r.id) || 
        guildConfig.adminRoles.includes(r.id)
    ) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
        return interaction.reply({
            content: "❌ Solo el personal del servidor puede renombrar los tickets.",
            flags: [MessageFlags.Ephemeral]
        });
    }

    try {
        const oldName = interaction.channel.name;
        await interaction.channel.setName(newName);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`✅ Canal renombrado de \`${oldName}\` a \`${newName}\`.`)
            .setFooter({ text: `Acción por ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error("❌ Error en comando /rename:", error);
        return interaction.reply({
            content: "❌ Hubo un error al intentar cambiar el nombre del canal. Discord tiene un límite de 2 cambios de nombre cada 10 minutos por canal.",
            flags: [MessageFlags.Ephemeral]
        });
    }
}
