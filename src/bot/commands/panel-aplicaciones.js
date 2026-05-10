import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js";
import { getGuildConfig } from "../../database/cache.js";

export const data = new SlashCommandBuilder()
    .setName("panel-aplicaciones")
    .setDescription("Envía el panel para postularse al staff (Solo Admins).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);

    if (!guildConfig.applications || guildConfig.applications.length === 0) {
        return interaction.reply({
            content: "❌ No hay aplicaciones configuradas. Créalas desde el Panel Web.",
            flags: [MessageFlags.Ephemeral]
        });
    }

    const validApplications = guildConfig.applications.filter(app => app?.id && app?.name);
    if (validApplications.length === 0) {
        return interaction.reply({
            content: "❌ Los formularios configurados no son válidos. Crea uno nuevo desde el dashboard.",
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (validApplications.length > 25) {
        return interaction.reply({
            content: "❌ Hay demasiados formularios configurados. Discord solo permite 25 botones por mensaje.",
            flags: [MessageFlags.Ephemeral]
        });
    }

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || typeof channel.send !== "function") {
        return interaction.reply({
            content: "❌ Este canal no admite mensajes normales. Usa un canal de texto.",
            flags: [MessageFlags.Ephemeral]
        });
    }

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("📋 Sistema de Aplicaciones")
        .setDescription("Selecciona el puesto al que deseas aplicar pulsando el botón correspondiente. Rellena el formulario con sinceridad.");

    const rows = [];
    for (let i = 0; i < validApplications.length; i += 5) {
        const row = new ActionRowBuilder();
        validApplications.slice(i, i + 5).forEach(app => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`app_start_${app.id}`)
                    .setLabel(`Aplicar a ${app.name}`.slice(0, 80))
                    .setStyle(ButtonStyle.Primary)
            );
        });
        rows.push(row);
    }

    await channel.send({ embeds: [embed], components: rows });

    await interaction.reply({
        content: "✅ Panel de aplicaciones enviado.",
        flags: [MessageFlags.Ephemeral]
    });
}
