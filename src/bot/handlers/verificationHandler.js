import { MessageFlags } from "discord.js";
import { getGuildConfig } from "../../database/cache.js";
import { t } from "../utils/i18n.js";

/**
 * Handler para cuando un usuario hace clic en "Verificarme"
 * customId: verify_button
 */
export async function handleVerifyButton(interaction) {
    try {
        const guildConfig = await getGuildConfig(interaction.guildId);
        const lang = guildConfig.language || "es";
        const verification = guildConfig.verification;

        if (!verification?.enabled || !verification?.roleId) {
            return interaction.reply({
                content: t(lang, "VERIFY_NOT_CONFIGURED"),
                flags: [MessageFlags.Ephemeral],
            });
        }

        const member = interaction.member;
        const roleId = verification.roleId;

        // Verificar si ya tiene el rol
        if (member.roles.cache.has(roleId)) {
            return interaction.reply({
                content: t(lang, "VERIFY_ALREADY_VERIFIED"),
                flags: [MessageFlags.Ephemeral],
            });
        }

        // Intentar asignar el rol
        try {
            await member.roles.add(roleId);
            await interaction.reply({
                content: t(lang, "VERIFY_SUCCESS"),
                flags: [MessageFlags.Ephemeral],
            });
        } catch (roleError) {
            console.error("❌ Error asignando rol de verificación:", roleError);
            await interaction.reply({
                content: t(lang, "VERIFY_ROLE_ERROR"),
                flags: [MessageFlags.Ephemeral],
            });
        }
    } catch (error) {
        console.error("❌ Error en verificación:", error);
        if (!interaction.replied) {
            await interaction.reply({
                content: "❌ Error al procesar la verificación.",
                flags: [MessageFlags.Ephemeral],
            }).catch(() => {});
        }
    }
}
