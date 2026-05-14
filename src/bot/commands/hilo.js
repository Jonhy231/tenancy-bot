import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    MessageFlags,
    ChannelType
} from "discord.js";
import Ticket from "../../database/models/Ticket.js";
import { getGuildConfig } from "../../database/cache.js";
import { t } from "../utils/i18n.js";

export const data = new SlashCommandBuilder()
    .setName("hilo")
    .setDescription("Crea un hilo privado solo para el personal en este ticket")
    .addStringOption(option => 
        option.setName("nombre")
            .setDescription("Nombre opcional para el hilo")
            .setRequired(false)
            .setMaxLength(100)
    );

export async function execute(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";
    const threadNameInput = interaction.options.getString("nombre") || "Personal - Ticket";

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
            content: "❌ Solo el personal del servidor puede crear hilos de staff.",
            flags: [MessageFlags.Ephemeral]
        });
    }

    try {
        // 3. Crear el hilo privado
        // Nota: Los hilos privados en canales públicos solo permiten el acceso a quienes sean invitados o tengan permisos.
        // Pero aquí lo usaremos para discusión interna.
        const thread = await interaction.channel.threads.create({
            name: threadNameInput,
            autoArchiveDuration: 1440, // 24 horas
            type: ChannelType.PrivateThread,
            reason: `Hilo de discusión interna para el ticket #${ticket.ticketNumber}`,
        });

        // 4. Invitar al staff (opcionalmente podrías mencionar roles pero los hilos privados requieren invitar miembros específicos o que hablen)
        // Por ahora, enviaremos un mensaje inicial en el hilo invitando al staff que esté viendo el canal.
        await thread.send({
            content: `🛡️ **Hilo de Discusión Interna**\nEste hilo es privado y solo para el personal del servidor.\nTicket ID: \`${ticket.channelId}\` | Abierto por: <@${ticket.userId}>`,
        });

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`✅ Se ha creado un hilo privado para el personal: <#${thread.id}>`)
            .setFooter({ text: `Acción por ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error("❌ Error en comando /hilo:", error);
        return interaction.reply({
            content: "❌ Hubo un error al intentar crear el hilo. Asegúrate de que el bot tenga el permiso 'Gestionar Hilos'.",
            flags: [MessageFlags.Ephemeral]
        });
    }
}
