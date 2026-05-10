import "dotenv/config";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { connectDB } from "../database/connection.js";
import { setupEvents } from "./events/ready.js";
import { loadCommands } from "./handlers/commandLoader.js";
import { startDashboard } from "../dashboard/server.js";
import { startHealthServer } from "./healthcheck.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
});

// Colección de comandos slash
client.commands = new Collection();

async function main() {
    // 1. Conectar a MongoDB
    await connectDB();

    // 2. Cargar comandos slash
    await loadCommands(client);

    // 3. Configurar eventos (tickets, botones, modales, slash commands)
    setupEvents(client);

    // 4. Login
    await client.login(process.env.BOT_TOKEN);

    // 5. Iniciar dashboard web (después del login)
    startDashboard(client);

    // 6. Servidor HTTP de healthcheck para Railway
    startHealthServer(client);
}

main().catch((err) => {
    console.error("❌ Error fatal al iniciar:", err);
    process.exit(1);
});
