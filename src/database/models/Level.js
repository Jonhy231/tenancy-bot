import mongoose from "mongoose";

const levelSchema = new mongoose.Schema({
    // ═══ Identificación ═══
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, default: "" },

    // ═══ Progreso ═══
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },

    // ═══ Cooldown ═══
    lastMessageAt: { type: Date, default: null },

}, { timestamps: true });

// Índice compuesto para leaderboard por servidor
levelSchema.index({ guildId: 1, xp: -1 });

export default mongoose.model("Level", levelSchema);
