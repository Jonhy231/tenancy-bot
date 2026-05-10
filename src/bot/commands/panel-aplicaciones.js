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

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("📋 Sistema de Aplicaciones")
            .setDescription("Selecciona el puesto al que deseas aplicar pulsando el botón correspondiente. Rellena el formulario con sinceridad.");

        const row = new ActionRowBuilder();

        guildConfig.applications.forEach(app => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`app_start_${app.id}`)
                    .setLabel(`Aplicar a ${app.name}`)
                    .setStyle(ButtonStyle.Primary)
            );
        });

        await interaction.channel.send({ embeds: [embed], components: [row] });

        await interaction.reply({
            content: "✅ Panel de aplicaciones enviado.",
            flags: [MessageFlags.Ephemeral]
        });
}
