import { MessageFlags } from "discord.js";
import { getGuildConfig } from "../../database/cache.js";
import { t } from "../utils/i18n.js";

/**
 * Handler para cuando un usuario selecciona una FAQ del select menu
 */
export async function handleFaqSelect(interaction) {
    try {
        const guildConfig = await getGuildConfig(interaction.guildId);
        const lang = guildConfig.language || "es";
        const faqId = interaction.values[0];

        const faqItem = guildConfig.faq?.find(f => f.id === faqId);
        if (!faqItem) {
            return interaction.reply({
                content: t(lang, "FAQ_NOT_FOUND"),
                flags: [MessageFlags.Ephemeral],
            });
        }

        await interaction.reply({
            embeds: [{
                title: `${faqItem.emoji} ${faqItem.question}`,
                description: faqItem.answer,
                color: 0x5865F2,
                footer: { text: t(lang, "FAQ_FOOTER") },
            }],
            flags: [MessageFlags.Ephemeral],
        });
    } catch (error) {
        console.error("❌ Error en FAQ select:", error);
        if (!interaction.replied) {
            await interaction.reply({
                content: "❌ Error al procesar la FAQ.",
                flags: [MessageFlags.Ephemeral],
            }).catch(() => {});
        }
    }
}
