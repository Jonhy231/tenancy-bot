import { Events } from "discord.js";
import { handleInteraction } from "./interactionCreate.js";

/**
 * Registra todos los event listeners del bot.
 */
export function setupEvents(client) {
    // ═══ Bot listo ═══
    client.once(Events.ClientReady, (c) => {
        console.log("══════════════════════════════════════");
        console.log(`🤖 Bot conectado como: ${c.user.tag}`);
        console.log(`📡 Servidores: ${c.guilds.cache.size}`);
        console.log("══════════════════════════════════════");
    });

    // ═══ Interacciones (comandos, botones, modales, menus) ═══
    client.on(Events.InteractionCreate, async (interaction) => {
        try {
            await handleInteraction(interaction);
        } catch (error) {
            console.error("❌ Error en interacción:", error);
            const reply = {
                content: "❌ Ocurrió un error al procesar la interacción.",
                flags: [64], // Ephemeral
            };
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            } catch (_) { /* Interacción ya expiró */ }
        }
    });

    // ═══ Mensajes (Niveles y Moderación) ═══
    client.on(Events.MessageCreate, async (message) => {
        try {
            const { handleMessageCreate } = await import("./messageCreate.js");
            await handleMessageCreate(message);
        } catch (error) {
            console.error("❌ Error en messageCreate:", error);
        }
    });
    client.on(Events.GuildCreate, async (guild) => {
        console.log(`🆕 Bot añadido a: ${guild.name} (${guild.id})`);
    });
}
