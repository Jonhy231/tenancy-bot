import { InteractionType, MessageFlags } from "discord.js";
import { handleTicketSelect, handleTicketModal, handleTicketButton, handleAddUserModal } from "../handlers/ticketHandler.js";

/**
 * Router central de interacciones.
 * Distribuye cada tipo de interacción al handler correspondiente.
 * Nota: La configuración del bot se gestiona exclusivamente desde el dashboard web.
 *       Los comandos /embed y /anuncio se manejan aquí.
 */
export async function handleInteraction(interaction) {

    // ═══ 1. Slash Commands (/embed, /anuncio) ═══
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ Error en /${interaction.commandName}:`, error);
            const reply = { content: "❌ Ocurrió un error al ejecutar el comando.", flags: MessageFlags.Ephemeral };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply).catch(() => {});
            } else {
                await interaction.reply(reply).catch(() => {});
            }
        }
        return;
    }

    // ═══ 2. Select Menus (Selección de categoría de ticket) ═══
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "ticket_category_select") {
            await handleTicketSelect(interaction);
            return;
        }
    }

    // ═══ 3. Modales ═══
    if (interaction.type === InteractionType.ModalSubmit) {
        // Modal de asunto de ticket
        if (interaction.customId.startsWith("ticket_modal_") && interaction.customId !== "ticket_modal_adduser") {
            await handleTicketModal(interaction);
            return;
        }
        // Modal de añadir usuario
        if (interaction.customId === "ticket_modal_adduser") {
            await handleAddUserModal(interaction);
            return;
        }
    }

    // ═══ 4. Botones (tickets — los botones de embed/anuncio usan collectors internos) ═══
    if (interaction.isButton()) {
        const buttonActions = ["ticket_close", "ticket_claim", "ticket_add"];
        const action = buttonActions.find(a => interaction.customId.startsWith(a));
        if (action) {
            await handleTicketButton(interaction);
            return;
        }
    }
}
