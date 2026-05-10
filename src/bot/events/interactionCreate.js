import { InteractionType, MessageFlags } from "discord.js";
import { handleTicketSelect, handleTicketModal, handleTicketButton, handleAddUserModal } from "../handlers/ticketHandler.js";
import { handleApplicationButton, handleApplicationModal, handleApplicationDecision } from "../handlers/applicationHandler.js";
import Ticket from "../../database/models/Ticket.js";
import { getGuildConfig } from "../../database/cache.js";
import { t } from "../utils/i18n.js";

export async function handleInteraction(interaction) {

    // ═══ 1. Slash Commands ═══
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ Error en /${interaction.commandName}:`, error);
            const reply = { content: "❌ Ocurrió un error.", flags: [MessageFlags.Ephemeral] };
            if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => {});
            else await interaction.reply(reply).catch(() => {});
        }
        return;
    }

    // ═══ 2. Select Menus ═══
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "ticket_category_select") {
            await handleTicketSelect(interaction);
            return;
        }
    }

    // ═══ 3. Modales ═══
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId.startsWith("ticket_modal_") && interaction.customId !== "ticket_modal_adduser") {
            await handleTicketModal(interaction);
            return;
        }
        if (interaction.customId === "ticket_modal_adduser") {
            await handleAddUserModal(interaction);
            return;
        }
        if (interaction.customId.startsWith("app_modal_")) {
            await handleApplicationModal(interaction);
            return;
        }
    }

    // ═══ 4. Botones ═══
    if (interaction.isButton()) {
        // Ticket Category Buttons (panel)
        if (interaction.customId.startsWith("ticket_cat_")) {
            await handleTicketButton(interaction);
            return;
        }

        // Tickets Management
        if (["ticket_close", "ticket_claim", "ticket_add"].some(a => interaction.customId.startsWith(a))) {
            await handleTicketButton(interaction);
            return;
        }
        
        // Appplication Start
        if (interaction.customId.startsWith("app_start_")) {
            await handleApplicationButton(interaction);
            return;
        }

        // Application Decision
        if (interaction.customId.startsWith("app_accept_") || interaction.customId.startsWith("app_deny_")) {
            await handleApplicationDecision(interaction);
            return;
        }

        // Ticket Rating via DM
        if (interaction.customId.startsWith("ticket_rate_")) {
            // format: ticket_rate_STARS_channelId
            const parts = interaction.customId.split("_");
            const stars = parseInt(parts[2]);
            const channelId = parts[3];

            try {
                const ticket = await Ticket.findOne({ channelId });
                if (ticket) {
                    await Ticket.updateOne({ _id: ticket._id }, { rating: stars });
                    const guildConfig = await getGuildConfig(ticket.guildId);
                    const lang = guildConfig.language || "es";
                    await interaction.update({
                        content: t(lang, "RATE_THANKS", { stars }),
                        embeds: [],
                        components: []
                    });
                } else {
                    await interaction.update({ content: "Error", embeds: [], components: [] });
                }
            } catch(e) {}
            return;
        }
    }
}

