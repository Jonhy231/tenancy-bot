import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    // ═══ Identificación ═══
    ticketNumber: { type: Number, required: true },         // Número auto-incremental por guild
    guildId: { type: String, required: true, index: true }, // Clave de aislamiento multi-tenant
    channelId: { type: String, default: "" },

    // ═══ Usuario ═══
    userId: { type: String, required: true },
    userName: { type: String, default: "" },

    // ═══ Categoría ═══
    categoryId: { type: String, default: "general" },
    categoryName: { type: String, default: "General" },

    // ═══ Estado ═══
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
    subject: { type: String, default: "Sin asunto" },

    // ═══ Staff ═══
    claimedBy: { type: String, default: null },
    claimedByName: { type: String, default: null },
    closedBy: { type: String, default: null },
    closedAt: { type: Date, default: null },

    // ═══ Participantes adicionales ═══
    addedUsers: [{ type: String }],

    // ═══ Reseñas (Reviews) ═══
    rating: { type: Number, default: null }, // 1 al 5
    reviewText: { type: String, default: "" },

}, { timestamps: true });

// Índice compuesto para queries eficientes multi-tenant
ticketSchema.index({ guildId: 1, status: 1 });
ticketSchema.index({ guildId: 1, userId: 1 });

export default mongoose.model("Ticket", ticketSchema);
