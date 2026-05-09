import mongoose from "mongoose";

/**
 * Conecta a MongoDB Atlas.
 * Se llama una vez al iniciar el bot.
 */
export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Conectado a MongoDB Atlas");
    } catch (error) {
        console.error("❌ Error al conectar a MongoDB:", error.message);
        process.exit(1);
    }
}
