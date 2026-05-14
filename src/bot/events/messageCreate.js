import { Events, MessageFlags } from "discord.js";
import { getGuildConfig } from "../../database/cache.js";
import Level from "../../database/models/Level.js";

// Cooldown para evitar spam de XP (1 minuto por usuario por servidor)
const xpCooldowns = new Set();

export async function handleMessageCreate(message) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const config = await getGuildConfig(guildId);

    // ═══ Moderación Automática ═══
    if (config.moderation) {
        let deleted = false;
        
        // 1. Anti-Links
        if (config.moderation.autoDeleteLinks) {
            const hasLink = /https?:\/\/[^\s]+/i.test(message.content);
            // Ignorar links si el usuario es admin (podríamos mejorarlo comprobando roles)
            if (hasLink && !message.member.permissions.has("ManageMessages")) {
                try {
                    await message.delete();
                    await message.channel.send({
                        content: `⚠️ ${message.author}, no está permitido enviar enlaces.`,
                        flags: [MessageFlags.Ephemeral]
                    });
                    deleted = true;
                } catch (e) {}
            }
        }

        // 2. Anti-Swear
        if (!deleted && config.moderation.autoDeleteSwearWords) {
            const swearWords = ["puta", "puto", "mierda", "cabron", "joder", "idiota", "imbecil", "zorra", "perra"]; // Básico
            const hasSwear = swearWords.some(word => message.content.toLowerCase().includes(word));
            if (hasSwear && !message.member.permissions.has("ManageMessages")) {
                try {
                    await message.delete();
                    await message.channel.send({
                        content: `⚠️ ${message.author}, modera tu vocabulario.`,
                        flags: [MessageFlags.Ephemeral]
                    });
                    deleted = true;
                } catch (e) {}
            }
        }

        if (deleted) return; // Si se borró, no damos XP
    }

    // ═══ Sistema de Niveles ═══
    if (config.levels && config.levels.enabled) {
        const cooldownKey = `${guildId}-${message.author.id}`;
        
        if (!xpCooldowns.has(cooldownKey)) {
            // Dar XP
            const xpToAdd = config.levels.xpPerMessage || 10;
            
            try {
                let userLevel = await Level.findOne({ guildId, userId: message.author.id });
                if (!userLevel) {
                    userLevel = new Level({
                        guildId,
                        userId: message.author.id,
                        userName: message.author.username
                    });
                }

                userLevel.xp += xpToAdd;
                
                // Calcular nivel (ej. Nivel 1 = 100xp, Nivel 2 = 300xp...)
                // Fórmula simple: level = floor(0.1 * sqrt(xp))
                const newLevel = Math.floor(0.1 * Math.sqrt(userLevel.xp));

                if (newLevel > userLevel.level) {
                    userLevel.level = newLevel;
                    
                    // Notificar level up
                    const channelId = config.levels.levelUpChannelId || message.channel.id;
                    const channel = message.guild.channels.cache.get(channelId);
                    if (channel) {
                        await channel.send(`🎉 ¡Felicidades ${message.author}! Has avanzado al nivel **${newLevel}**.`);
                    }
                }

                await userLevel.save();

                // Añadir cooldown
                xpCooldowns.add(cooldownKey);
                setTimeout(() => {
                    xpCooldowns.delete(cooldownKey);
                }, 60000); // 1 minuto
            } catch (err) {
                console.error("Error actualizando XP:", err);
            }
        }
    }
}
