import { InteractionType, MessageFlags } from "discord.js";
import { handleTicketSelect, handleTicketModal, handleTicketButton, handleAddUserModal } from "../handlers/ticketHandler.js";

/**
 * Router central de interacciones.
 * Distribuye cada tipo de interacción al handler correspondiente.
 * Nota: La configuración del bot se gestiona exclusivamente desde el dashboard web.
 */
export async function handleInteraction(interaction) {

    // ═══ 1. Select Menus (Selección de categoría de ticket) ═══
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "ticket_category_select") {
            await handleTicketSelect(interaction);
            return;
        }
    }

    // ═══ 2. Modales ═══
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

    // ═══ 3. Botones ═══
    if (interaction.isButton()) {
        const buttonActions = ["ticket_close", "ticket_claim", "ticket_add"];
        const action = buttonActions.find(a => interaction.customId.startsWith(a));
        if (action) {
            await handleTicketButton(interaction);
            return;
        }
    }
}
