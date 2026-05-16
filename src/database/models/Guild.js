import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    emoji: { type: String, default: "🎫" },
    description: { type: String, default: "Soporte general" },
});

// Botones para el panel tipo Contact System
const customButtonSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    emoji: { type: String, default: "🎫" },
    color: { type: String, enum: ["primary", "secondary", "success", "danger"], default: "primary" },
    description: { type: String, default: "" },
    categoryId: { type: String, default: "" },
}, { _id: false });

const customPanelSchema = new mongoose.Schema({
    banner: { type: String, default: "" },
    title: { type: String, default: "Contact System" },
    description: { type: String, default: "Selecciona una opción para abrir un ticket." },
    color: { type: String, default: "#5865F2" },
    buttons: { type: [customButtonSchema], default: [] },
}, { _id: false });

const embedFieldSchema = new mongoose.Schema({
    name: { type: String, default: "\u200b" },
    value: { type: String, default: "\u200b" },
    inline: { type: Boolean, default: false },
}, { _id: false });

const panelEmbedSchema = new mongoose.Schema({
    title: { type: String, default: "🎫 Sistema de Tickets" },
    description: { type: String, default: "Selecciona una categoría para abrir un ticket.\nNuestro equipo te atenderá lo antes posible." },
    color: { type: String, default: "#5865F2" },
    thumbnail: { type: String, default: "" },
    image: { type: String, default: "" },
    footer: { type: String, default: "Sistema de soporte" },
    fields: { type: [embedFieldSchema], default: [] },
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

    // ═══ Contadores y Límites ═══
    ticketCounter: { type: Number, default: 0 },
    totalTicketsCreated: { type: Number, default: 0 },
    
    // ═══ Modo del Panel de Tickets ═══
    ticketMode: { type: String, enum: ["classic", "custom"], default: "classic" },
    customPanel: { type: customPanelSchema, default: () => ({}) },

    // ═══ Sistema Premium ═══
    isPremium: { type: Boolean, default: false },
    premium: {
        active: { type: Boolean, default: false },
        expiresAt: { type: Date, default: null },
        permanent: { type: Boolean, default: false },
        grantedBy: { type: String, default: null },
        reason: { type: String, default: "" },
        startDate: { type: Date, default: null },
    },

    // ═══ Moderación ═══
    moderation: {
        logChannelId: { type: String, default: "" },
        autoDeleteLinks: { type: Boolean, default: false },
        autoDeleteSwearWords: { type: Boolean, default: false },
    },

    // ═══ Niveles ═══
    levels: {
        enabled: { type: Boolean, default: false },
        xpPerMessage: { type: Number, default: 10 },
        levelUpChannelId: { type: String, default: "" },
    },

    // ═══ Internacionalización ═══
    language: { type: String, enum: ["es", "en"], default: "es" },

    // ═══ Sistema de Aplicaciones ═══
    applicationsChannelId: { type: String, default: "" },
    applicationsPanelChannelId: { type: String, default: "" },
    applicationsPanelMessageId: { type: String, default: "" },
    applications: [{
        id: { type: String, default: "" },
        name: { type: String, default: "" },
        questions: [{ type: String }], // Hasta 5 preguntas
        roleToGive: { type: String, default: "" }
    }],

}, { timestamps: true });

export default mongoose.model("Guild", guildSchema);
