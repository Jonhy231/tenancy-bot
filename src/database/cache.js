import Guild from "./models/Guild.js";

/**
 * Caché en memoria con TTL (Time To Live).
 * Evita consultar MongoDB en cada interacción de Discord.
 * TTL: 5 minutos por defecto.
 */
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene la configuración del servidor.
 * Primero intenta desde caché, luego desde MongoDB.
 * Si no existe, crea un documento nuevo.
 */
export async function getGuildConfig(guildId) {
    // 1. Intentar desde caché
    const cached = cache.get(guildId);
    if (cached && Date.now() - cached.timestamp < TTL) {
        return cached.data;
    }

    // 2. Buscar en MongoDB (o crear si no existe)
    let config = await Guild.findOne({ guildId });
    if (!config) {
        config = await Guild.create({ guildId });
    }

    // 3. Guardar en caché
    cache.set(guildId, { data: config, timestamp: Date.now() });
    return config;
}

/**
 * Actualiza la configuración del servidor y refresca la caché.
 */
export async function updateGuildConfig(guildId, updates) {
    const config = await Guild.findOneAndUpdate(
        { guildId },
        { $set: updates },
        { new: true, upsert: true }
    );

    // Refrescar caché
    cache.set(guildId, { data: config, timestamp: Date.now() });
    return config;
}

/**
 * Invalida la caché de un servidor específico.
 * Útil cuando se hacen cambios desde el dashboard.
 */
export function invalidateCache(guildId) {
    cache.delete(guildId);
}

/**
 * Limpia toda la caché.
 */
export function clearCache() {
    cache.clear();
}
