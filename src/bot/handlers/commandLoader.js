import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Carga dinámicamente todos los archivos de la carpeta /commands
 * y los registra en client.commands
 */
export async function loadCommands(client) {
    const commandsPath = path.join(__dirname, "..", "commands");
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(`file://${filePath}`);

        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            console.log(`  📌 Comando cargado: /${command.data.name}`);
        } else {
            console.warn(`  ⚠️ Comando inválido: ${file} (falta data o execute)`);
        }
    }

    console.log(`✅ ${client.commands.size} comandos cargados`);
}
