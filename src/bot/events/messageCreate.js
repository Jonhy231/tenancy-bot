import { Events, MessageFlags } from "discord.js";
import { getGuildConfig } from "../../database/cache.js";
import Level from "../../database/models/Level.js";

// Cooldown para evitar spam de XP (1 minuto por usuario por servidor)
const xpCooldowns = new Set();

// Lista base de palabras prohibidas
const DEFAULT_SWEAR_WORDS = ["puta", "puto", "mierda", "cabron", "joder", "idiota", "imbecil", "zorra", "perra"];

export async function handleMessageCreate(message) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const config = await getGuildConfig(guildId);

    // ═══ Moderación Automática ═══
    if (config.moderation?.enabled) {
        let deleted = false;
        
        // 1. Anti-Links
        if (config.moderation.autoDeleteLinks) {
            const hasLink = /https?:\/\/[^\s]+/i.test(message.content);
            const isWhitelisted = (config.moderation.linkWhitelistChannels || []).includes(message.channel.id);
            
            if (hasLink && !isWhitelisted && !message.member.permissions.has("ManageMessages")) {
                try {
                    await message.delete();
                    const warn = await message.channel.send({
                        content: `⚠️ ${message.author}, no está permitido enviar enlaces en este canal.`,
                    });
                    setTimeout(() => warn.delete().catch(() => {}), 5000);
                    deleted = true;

                    // Log de moderación
                    await sendModLog(message.guild, config, {
                        title: "🔗 Enlace Eliminado",
                        user: message.author,
                        channel: message.channel,
                        content: message.content,
                        color: 0xFFA500,
                    });
                } catch (e) {}
            }
        }

        // 2. Anti-Swear (palabras prohibidas)
        if (!deleted && config.moderation.autoDeleteSwearWords) {
            const customWords = config.moderation.customSwearWords || [];
            const useDefault = config.moderation.useDefaultSwearWords !== false;
            const swearList = [
                ...(useDefault ? DEFAULT_SWEAR_WORDS : []),
                ...customWords.map(w => w.toLowerCase()),
            ];

            const msgLower = message.content.toLowerCase();
            const hasSwear = swearList.some(word => msgLower.includes(word));

            if (hasSwear && !message.member.permissions.has("ManageMessages")) {
                try {
                    await message.delete();
                    const warn = await message.channel.send({
                        content: `⚠️ ${message.author}, modera tu vocabulario.`,
                    });
                    setTimeout(() => warn.delete().catch(() => {}), 5000);
                    deleted = true;

                    await sendModLog(message.guild, config, {
                        title: "🤬 Palabra Prohibida",
                        user: message.author,
                        channel: message.channel,
                        content: message.content,
                        color: 0xFF0000,
                    });
                } catch (e) {}
            }
        }

        if (deleted) return; // Si se borró, no damos XP ni procesamos auto-responses
    }

    // ═══ Auto-Responses ═══
    if (config.autoResponses?.length > 0) {
        const msgContent = message.content;
        const msgLower = msgContent.toLowerCase();

        for (const ar of config.autoResponses) {
            // Filtro por canal (vacío = todos)
            if (ar.channelIds?.length > 0 && !ar.channelIds.includes(message.channel.id)) continue;

            let matches = false;
            if (ar.matchType === "exact") {
                matches = msgLower === ar.trigger.toLowerCase();
            } else {
                matches = msgLower.includes(ar.trigger.toLowerCase());
            }

            if (matches) {
                try {
                    await message.channel.send(ar.response);
                } catch (e) {
                    console.error("Error en auto-response:", e);
                }
                break; // Solo una respuesta por mensaje
            }
        }
    }

    // ═══ Sistema de Niveles ═══
    if (config.levels?.enabled) {
        const cooldownKey = `${guildId}-${message.author.id}`;
        
        if (!xpCooldowns.has(cooldownKey)) {
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
                userLevel.userName = message.author.username; // Actualizar nombre
                
                // Fórmula de nivel: level = floor(0.1 * sqrt(xp))
                const newLevel = Math.floor(0.1 * Math.sqrt(userLevel.xp));

                if (newLevel > userLevel.level) {
                    userLevel.level = newLevel;
                    
                    // Notificar level up
                    const channelId = config.levels.levelUpChannelId || message.channel.id;
                    const channel = message.guild.channels.cache.get(channelId);
                    if (channel) {
                        const msg = (config.levels.levelUpMessage || "🎉 ¡Felicidades {user}! Has avanzado al nivel **{level}**.")
                            .replace("{user}", message.author.toString())
                            .replace("{level}", newLevel.toString());
                        await channel.send(msg);
                    }

                    // ═══ Asignar Roles por Nivel ═══
                    if (config.levels.roleRewards?.length > 0) {
                        for (const reward of config.levels.roleRewards) {
                            if (newLevel >= reward.level && reward.roleId) {
                                try {
                                    if (!message.member.roles.cache.has(reward.roleId)) {
                                        await message.member.roles.add(reward.roleId);
                                    }
                                } catch (roleErr) {
                                    console.error(`Error asignando rol de nivel ${reward.level}:`, roleErr.message);
                                }
                            }
                        }
                    }
                }

                await userLevel.save();

                // Cooldown de 1 minuto
                xpCooldowns.add(cooldownKey);
                setTimeout(() => {
                    xpCooldowns.delete(cooldownKey);
                }, 60000);
            } catch (err) {
                console.error("Error actualizando XP:", err);
            }
        }
    }
}

/**
 * Enviar log de moderación al canal configurado
 */
async function sendModLog(guild, config, { title, user, channel, content, color }) {
    const logChannelId = config.moderation?.logChannelId;
    if (!logChannelId) return;

    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    try {
        await logChannel.send({
            embeds: [{
                title,
                fields: [
                    { name: "👤 Usuario", value: `${user.tag} (${user.id})`, inline: true },
                    { name: "📍 Canal", value: `<#${channel.id}>`, inline: true },
                    { name: "💬 Contenido", value: content?.substring(0, 1024) || "N/A" },
                ],
                color,
                timestamp: new Date().toISOString(),
            }],
        });
    } catch (e) {
        console.error("Error enviando mod log:", e);
    }
}
