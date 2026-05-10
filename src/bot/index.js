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

client.commands = new Collection();

async function main() {
    // 1. Express arranca PRIMERO — Railway necesita /health respondiendo
    //    antes de que pasen los 30s del healthcheckTimeout.
    startDashboard(client);

    // 2. Conectar a MongoDB (si falla, loggeamos pero NO matamos el proceso)
    try {
        await connectDB();
    } catch (err) {
        console.error("⚠️  MongoDB no disponible al arrancar:", err.message);
        // No hacemos process.exit() — Express ya está vivo para el healthcheck
    }

    // 3. Cargar comandos slash
    await loadCommands(client);

    // 4. Configurar eventos
    setupEvents(client);

    // 5. Login a Discord
    await client.login(process.env.BOT_TOKEN);
}

main().catch((err) => {
    console.error("❌ Error fatal al iniciar:", err);
    process.exit(1);
});
