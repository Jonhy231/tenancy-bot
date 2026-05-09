import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

console.log("📋 Cargando definiciones de comandos...");

for (const file of commandFiles) {
    const command = await import(`file://${path.join(commandsPath, file)}`);
    if (command.data) {
        commands.push(command.data.toJSON());
        console.log(`  ✅ ${command.data.name}`);
    }
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

try {
    console.log(`\n🔄 Registrando ${commands.length} comandos globalmente...`);

    // Limpiar comandos locales del guild de prueba (si los hay)
    // Descomenta la línea de abajo si quieres limpiar un guild específico:
    // await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, "TU_GUILD_ID"), { body: [] });

    // Registrar globalmente
    const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
    );

    console.log(`✅ ${data.length} comandos registrados globalmente.`);
    console.log("⏳ Los comandos globales pueden tardar hasta 1 hora en aparecer en todos los servidores.");
} catch (error) {
    console.error("❌ Error al registrar comandos:", error);
}
