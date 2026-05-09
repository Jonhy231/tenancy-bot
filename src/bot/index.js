import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { connectDB } from "../database/connection.js";
import { setupEvents } from "./events/ready.js";
import { startDashboard } from "../dashboard/server.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
});

async function main() {
    // 1. Conectar a MongoDB
    await connectDB();

    // 2. Configurar eventos (tickets, botones, modales)
    setupEvents(client);

    // 3. Login
    await client.login(process.env.BOT_TOKEN);

    // 4. Iniciar dashboard web (después del login)
    startDashboard(client);
}

main().catch((err) => {
    console.error("❌ Error fatal al iniciar:", err);
    process.exit(1);
});
