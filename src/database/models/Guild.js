import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    emoji: { type: String, default: "🎫" },
    description: { type: String, default: "Soporte general" },
});

const panelEmbedSchema = new mongoose.Schema({
    title: { type: String, default: "🎫 Sistema de Tickets" },
    description: { type: String, default: "Selecciona una categoría para abrir un ticket.\nNuestro equipo te atenderá lo antes posible." },
    color: { type: String, default: "#5865F2" },
    thumbnail: { type: String, default: "" },
    image: { type: String, default: "" },
    footer: { type: String, default: "Sistema de soporte" },
}, { _id: false });

const guildSchema = new mongoose.Schema({
    // ═══ Identificación del Tenant ═══
    guildId: { type: String, required: true, unique: true, index: true },
    guildName: { type: String, default: "" },
    guildIcon: { type: String, default: "" },

    // ═══ Configuración de Tickets ═══
    ticketCategoryId: { type: String, default: "" },       // Categoría de Discord para canales
    transcriptChannelId: { type: String, default: "" },    // Canal donde se envían transcripciones
    logChannelId: { type: String, default: "" },           // Canal de logs

    // ═══ Roles ═══
    supportRoles: [{ type: String }],                      // Roles que pueden ver/gestionar tickets
    adminRoles: [{ type: String }],                        // Roles con acceso total
    dashboardRoles: [{ type: String }],                    // Roles con acceso al dashboard web

    // ═══ Panel de Tickets ═══
    panelChannelId: { type: String, default: "" },             // Canal donde se envía el panel
    panelMessageId: { type: String, default: "" },             // ID del mensaje del panel (para editar)
    panelEmbed: { type: panelEmbedSchema, default: () => ({}) },

    // ═══ Mensaje de Bienvenida al Ticket ═══
    ticketGreeting: {
        type: String,
        default: "¡Hola {user}! 👋\nGracias por abrir un ticket. Un miembro del equipo te atenderá pronto.\n\n**Asunto:** {subject}"
    },

    // ═══ Categorías de Tickets ═══
    categories: [categorySchema],

    // ═══ Usuarios Baneados ═══
    bannedUsers: [{ type: String }],

    // ═══ Contadores ═══
    ticketCounter: { type: Number, default: 0 },

}, { timestamps: true });

export default mongoose.model("Guild", guildSchema);
