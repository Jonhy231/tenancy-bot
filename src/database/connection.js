import mongoose from "mongoose";

/**
 * Conecta a MongoDB Atlas.
 * NO llama process.exit() — deja que el caller decida qué hacer.
 * Esto permite que Express siga vivo para el healthcheck de Railway
 * incluso si MongoDB tarda en conectar.
 */
export async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB Atlas");
}
