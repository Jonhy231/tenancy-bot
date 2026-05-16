import mongoose from "mongoose";

const pollOptionSchema = new mongoose.Schema({
    label: { type: String, required: true },
    emoji: { type: String, default: "" },
    votes: { type: Number, default: 0 },
}, { _id: false });

const pollSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, default: "" },
    messageId: { type: String, default: "" },
    question: { type: String, required: true },
    options: { type: [pollOptionSchema], required: true },
    isAnonymous: { type: Boolean, default: false },
    voters: { type: Map, of: Number, default: new Map() }, // userId → optionIndex
    createdBy: { type: String, default: "" },
    endsAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
}, { timestamps: true });

pollSchema.index({ guildId: 1, active: 1 });

export default mongoose.model("Poll", pollSchema);
