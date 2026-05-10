import "dotenv/config";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { connectDB } from "../database/connection.js";
import { setupEvents } from "./events/ready.js";
import { loadCommands } from "./handlers/commandLoader.js";
import { startDashboard } from "../dashboard/server.js";

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

    // 4. Iniciar dashboard ANTES del login para que Railway
    //    encuentre el servidor HTTP desde el primer healthcheck
    startDashboard(client);

    // 5. Login (el bot se conecta a Discord en segundo plano)
    await client.login(process.env.BOT_TOKEN);
}

main().catch((err) => {
    console.error("❌ Error fatal al iniciar:", err);
    process.exit(1);
});
