import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { getGuildConfig, updateGuildConfig, invalidateCache } from "../database/cache.js";
import Ticket from "../database/models/Ticket.js";
import Guild from "../database/models/Guild.js";
import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
} from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Inicia el dashboard web.
 * @param {import("discord.js").Client} client - El cliente de Discord
 */
export function startDashboard(client) {
    const app = express();
    const PORT = process.env.PORT || process.env.DASHBOARD_PORT || 3000;

    // ═══ Middleware ═══
    app.use(express.json());
    app.use(express.static(path.join(__dirname, "public")));
    app.use(session({
        secret: process.env.SESSION_SECRET || "tenancy-bot-secret",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 horas
    }));

    // ══════════════════════════════════════
    // HEALTH CHECK (Railway / Render)
    // ══════════════════════════════════════

    app.get("/health", (req, res) => {
        res.status(200).json({
            status: "ok",
            uptime: Math.floor(process.uptime()),
            bot: client.isReady() ? "online" : "connecting",
            guilds: client.guilds.cache.size,
        });
    });

    // ══════════════════════════════════════
    // AUTH: Discord OAuth2
    // ══════════════════════════════════════

    // Redirigir a Discord para login
    app.get("/auth/discord", (req, res) => {
        const params = new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            redirect_uri: `${process.env.DASHBOARD_URL}/auth/callback`,
            response_type: "code",
            scope: "identify guilds",
        });
        res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
    });

    // Callback de Discord
    app.get("/auth/callback", async (req, res) => {
        const { code } = req.query;
        if (!code) return res.redirect("/?error=no_code");

        try {
            // Intercambiar código por token
            const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: `${process.env.DASHBOARD_URL}/auth/callback`,
                }),
            });

            const tokenData = await tokenRes.json();
            if (!tokenData.access_token) return res.redirect("/?error=token_failed");

            // Obtener datos del usuario
            const userRes = await fetch("https://discord.com/api/v10/users/@me", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const userData = await userRes.json();

            // Obtener guilds del usuario
            const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const userGuilds = await guildsRes.json();

            // Guardar en sesión
            req.session.user = {
                id: userData.id,
                username: userData.username,
                avatar: userData.avatar,
                guilds: userGuilds,
                accessToken: tokenData.access_token,
            };

            res.redirect("/dashboard.html");
        } catch (error) {
            console.error("❌ Error en OAuth2:", error);
            res.redirect("/?error=auth_failed");
        }
    });

    // Cerrar sesión
    app.get("/auth/logout", (req, res) => {
        req.session.destroy();
        res.redirect("/");
    });

    // Verificar sesión
    app.get("/api/me", (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });
        const { id, username, avatar } = req.session.user;
        const isDev = id === "601394346826268673";
        res.json({ id, username, avatar, isDev });
    });

    // ══════════════════════════════════════
    // API: Servidores
    // ══════════════════════════════════════

    // Listar servidores donde el usuario tiene permisos (con y sin bot)
    app.get("/api/servers", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const userGuilds = req.session.user.guilds || [];
        const MANAGE_GUILD = 0x20; 

        const botGuildIds = userGuilds.filter(g => client.guilds.cache.has(g.id)).map(g => g.id);
        const configs = await Guild.find({ guildId: { $in: botGuildIds }, 'dashboardRoles.0': { $exists: true } }).lean();

        const serversWithBot = [];
        const serversWithoutBot = [];

        for (const g of userGuilds) {
            const hasNativePerms = (parseInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD || g.owner;
            const guildObj = client.guilds.cache.get(g.id);

            // Icon formatter
            const iconUrl = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;

            if (guildObj) {
                // Bot ESTÁ en el servidor
                let hasAccess = hasNativePerms;
                if (!hasAccess) {
                    const config = configs.find(c => c.guildId === g.id);
                    if (config && config.dashboardRoles?.length > 0) {
                        try {
                            const member = await guildObj.members.fetch(req.session.user.id);
                            if (member && member.roles.cache.some(r => config.dashboardRoles.includes(r.id))) {
                                hasAccess = true;
                            }
                        } catch(e) {}
                    }
                }
                
                if (hasAccess) {
                    serversWithBot.push({
                        id: g.id,
                        name: guildObj.name,
                        icon: guildObj.iconURL({ size: 128 }) || iconUrl,
                        memberCount: guildObj.memberCount || 0,
                        hasBot: true
                    });
                }
            } else {
                // Bot NO está en el servidor
                if (hasNativePerms) {
                    serversWithoutBot.push({
                        id: g.id,
                        name: g.name,
                        icon: iconUrl,
                        memberCount: 0,
                        hasBot: false
                    });
                }
            }
        }

        res.json({ serversWithBot, serversWithoutBot });
    });

    // Obtener detalles de un servidor específico
    app.get("/api/server/:guildId", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const { guildId } = req.params;

        // Verificar permisos
        if (!(await hasAccess(req.session.user, guildId))) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        const config = await getGuildConfig(guildId);
        const guild = client.guilds.cache.get(guildId);

        // Estadísticas de tickets
        const openTickets = await Ticket.countDocuments({ guildId, status: "open" });
        const closedTickets = await Ticket.countDocuments({ guildId, status: "closed" });
        const totalTickets = openTickets + closedTickets;

        // Tickets recientes
        const recentTickets = await Ticket.find({ guildId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const MANAGE_GUILD = 0x20;
        const nativeAccess = req.session.user.guilds?.some(g => {
            return g.id === guildId && ((parseInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD || g.owner);
        });

        res.json({
            guild: {
                id: guildId,
                name: guild?.name || config.guildName,
                icon: guild?.iconURL({ size: 128 }) || null,
                memberCount: guild?.memberCount || 0,
                isNativeAdmin: nativeAccess,
                isPremium: config.isPremium,
                totalTicketsCreated: config.totalTicketsCreated,
            },
            config: {
                ticketCategoryId: config.ticketCategoryId,
                transcriptChannelId: config.transcriptChannelId,
                logChannelId: config.logChannelId,
                supportRoles: config.supportRoles,
                adminRoles: config.adminRoles,
                dashboardRoles: config.dashboardRoles,
                panelEmbed: config.panelEmbed,
                panelChannelId: config.panelChannelId,
                panelMessageId: config.panelMessageId,
                ticketGreeting: config.ticketGreeting,
                categories: config.categories,
                bannedUsers: config.bannedUsers,
                language: config.language,
                applicationsChannelId: config.applicationsChannelId,
                applicationsPanelChannelId: config.applicationsPanelChannelId,
                applicationsPanelMessageId: config.applicationsPanelMessageId,
                applications: config.applications,
            },
            stats: {
                openTickets,
                closedTickets,
                totalTickets,
                categories: config.categories.length,
                bannedUsers: config.bannedUsers.length,
            },
            recentTickets,
        });
    });

    // ══════════════════════════════════════
    // API: Roles del servidor (Discord)
    // ══════════════════════════════════════

    app.get("/api/server/:guildId/roles", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const { guildId } = req.params;
        if (!(await hasAccess(req.session.user, guildId))) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Servidor no encontrado" });

        // Devolver roles (excluyendo @everyone y roles del bot)
        const roles = guild.roles.cache
            .filter(r => r.id !== guild.id && !r.managed)
            .sort((a, b) => b.position - a.position)
            .map(r => ({
                id: r.id,
                name: r.name,
                color: r.hexColor,
                position: r.position,
            }));

        res.json(roles);
    });

    // ══════════════════════════════════════
    // API: Canales del servidor (Discord)
    // ══════════════════════════════════════

    app.get("/api/server/:guildId/channels", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const { guildId } = req.params;
        if (!(await hasAccess(req.session.user, guildId))) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Servidor no encontrado" });

        // Canales de texto
        const textChannels = guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .sort((a, b) => a.position - b.position)
            .map(c => ({
                id: c.id,
                name: c.name,
                type: "text",
                parentId: c.parentId,
                parentName: c.parent?.name || null,
            }));

        // Categorías de Discord
        const categories = guild.channels.cache
            .filter(c => c.type === ChannelType.GuildCategory)
            .sort((a, b) => a.position - b.position)
            .map(c => ({
                id: c.id,
                name: c.name,
                type: "category",
            }));

        res.json({ textChannels, categories });
    });

    // ══════════════════════════════════════
    // API: Configuración del servidor
    // ══════════════════════════════════════

    // Actualizar configuración de un servidor
    app.patch("/api/server/:guildId/config", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const { guildId } = req.params;
        if (!(await hasAccess(req.session.user, guildId))) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        // Lista blanca de campos editables
        // Solo administradores nativos pueden modificar roles sensibles
        const MANAGE_GUILD = 0x20;
        const nativeAccess = req.session.user.guilds?.some(g => {
            return g.id === guildId && ((parseInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD || g.owner);
        });

        const allowedFields = [
            "supportRoles", 
            ...(nativeAccess ? ["adminRoles", "dashboardRoles"] : []),
            "ticketCategoryId", "logChannelId", "transcriptChannelId",
            "panelChannelId", "panelEmbed", "ticketGreeting",
            "language", "applicationsChannelId", "applicationsPanelChannelId", "applications",
        ];

        const updates = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No hay campos válidos para actualizar" });
        }

        try {
            const config = await updateGuildConfig(guildId, updates);
            res.json({ success: true, config });
        } catch (error) {
            console.error("❌ Error al actualizar config:", error);
            res.status(500).json({ error: "Error al actualizar" });
        }
    });

    // ══════════════════════════════════════
    // API: Categorías de tickets
    // ══════════════════════════════════════

    // Añadir categoría
    app.post("/api/server/:guildId/categories", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const { guildId } = req.params;
        if (!(await hasAccess(req.session.user, guildId))) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        const { name, emoji, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "El nombre es obligatorio" });
        }

        const config = await getGuildConfig(guildId);

        if (config.categories.length >= 25) {
            return res.status(400).json({ error: "Máximo absoluto de 25 categorías" });
        }

        if (!config.isPremium && config.categories.length >= 3) {
            return res.status(403).json({ error: "Límite de 3 categorías alcanzado. Actualiza a Tenancy Premium para categorías ilimitadas." });
        }

        if (config.categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
            return res.status(400).json({ error: `Ya existe una categoría llamada "${name}"` });
        }

        const newCategory = {
            id: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36),
            name: name.trim(),
            emoji: emoji || "🎫",
            description: description || "Soporte",
        };

        config.categories.push(newCategory);
        await updateGuildConfig(guildId, { categories: config.categories });
        res.json({ success: true, category: newCategory });
    });

    // Eliminar categoría
    app.delete("/api/server/:guildId/categories/:catId", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const { guildId, catId } = req.params;
        if (!(await hasAccess(req.session.user, guildId))) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        const config = await getGuildConfig(guildId);
        const idx = config.categories.findIndex(c => c.id === catId);
        if (idx === -1) return res.status(404).json({ error: "Categoría no encontrada" });

        config.categories.splice(idx, 1);
        await updateGuildConfig(guildId, { categories: config.categories });
        res.json({ success: true });
    });

    // ══════════════════════════════════════
    // API: Enviar/Actualizar Panel de Tickets
    // ══════════════════════════════════════

    app.post("/api/server/:guildId/panel/send", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const { guildId } = req.params;
        if (!(await hasAccess(req.session.user, guildId))) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        try {
            const config = await getGuildConfig(guildId);
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({ error: "El bot no está en ese servidor" });
            }

            // Verificar que hay categorías configuradas
            if (!config.categories || config.categories.length === 0) {
                return res.status(400).json({ error: "Debes crear al menos una categoría de tickets antes de enviar el panel" });
            }

            // Verificar que hay un canal configurado
            const channelId = config.panelChannelId;
            if (!channelId) {
                return res.status(400).json({ error: "Debes configurar el canal del panel antes de enviarlo" });
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                return res.status(404).json({ error: "No se encontró el canal configurado. Verifica que existe y el bot tiene acceso." });
            }

            // ═══ Construir Embed ═══
            const panel = config.panelEmbed || {};
            const embed = new EmbedBuilder()
                .setTitle(panel.title || "🎫 Sistema de Tickets")
                .setDescription(panel.description || "Selecciona una categoría para abrir un ticket.\nNuestro equipo te atenderá lo antes posible.")
                .setColor(parseInt((panel.color || "#5865F2").replace("#", ""), 16))
                .setTimestamp();

            if (panel.thumbnail) embed.setThumbnail(panel.thumbnail);
            if (panel.image) embed.setImage(panel.image);

            if (config.isPremium) {
                if (panel.footer) embed.setFooter({ text: panel.footer });
            } else {
                embed.setFooter({ text: "⚡ Powered by Tenancy" });
            }

            // ═══ Construir Select Menu ═══
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("ticket_category_select")
                .setPlaceholder("📂 Selecciona una categoría...");

            for (const cat of config.categories) {
                const option = new StringSelectMenuOptionBuilder()
                    .setLabel(cat.name)
                    .setValue(cat.id)
                    .setDescription(cat.description || "Soporte");

                if (cat.emoji) option.setEmoji(cat.emoji);
                selectMenu.addOptions(option);
            }

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const messagePayload = {
                embeds: [embed],
                components: [row],
            };

            // ═══ Enviar o Editar ═══
            let messageId = config.panelMessageId;
            let action = "enviado";

            // Intentar editar el mensaje existente
            if (messageId) {
                try {
                    const existingMessage = await channel.messages.fetch(messageId);
                    await existingMessage.edit(messagePayload);
                    action = "actualizado";
                } catch (_) {
                    // El mensaje ya no existe, enviar uno nuevo
                    messageId = null;
                }
            }

            // Enviar nuevo mensaje si no se pudo editar
            if (!messageId) {
                const sent = await channel.send(messagePayload);
                messageId = sent.id;
                action = "enviado";
            }

            // Guardar IDs en la config
            await updateGuildConfig(guildId, {
                panelChannelId: channelId,
                panelMessageId: messageId,
            });

            res.json({
                success: true,
                action,
                channelId,
                messageId,
            });

        } catch (error) {
            console.error("❌ Error al enviar panel:", error);
            res.status(500).json({ error: "Error al enviar el panel. Verifica que el bot tiene permisos en el canal." });
        }
    });

    // ══════════════════════════════════════
    // API: Enviar Panel de Aplicaciones
    // ══════════════════════════════════════
    
    app.post("/api/server/:guildId/panel-app/send", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const { guildId } = req.params;
        if (!(await hasAccess(req.session.user, guildId))) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        try {
            const config = await getGuildConfig(guildId);
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: "El bot no está en ese servidor" });

            if (!config.applications || config.applications.length === 0) {
                return res.status(400).json({ error: "Debes crear al menos un formulario antes de enviar el panel" });
            }

            const { targetChannelId } = req.body;
            const channelId = targetChannelId || config.applicationsPanelChannelId;
            if (!channelId) {
                return res.status(400).json({ error: "Debes seleccionar un canal para publicar el panel de aplicaciones" });
            }

            const validApplications = config.applications.filter(app => app?.id && app?.name);
            if (validApplications.length === 0) {
                return res.status(400).json({ error: "Los formularios configurados no son válidos. Crea uno nuevo desde el dashboard." });
            }

            if (validApplications.length > 25) {
                return res.status(400).json({ error: "Discord solo permite 25 botones por mensaje. Reduce el número de formularios." });
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) return res.status(404).json({ error: "No se encontró el canal de destino en el servidor" });

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("📋 Sistema de Aplicaciones")
                .setDescription("Selecciona el puesto al que deseas aplicar pulsando el botón correspondiente. Rellena el formulario con sinceridad.");

            const rows = [];
            for (let i = 0; i < validApplications.length; i += 5) {
                const row = new ActionRowBuilder();
                validApplications.slice(i, i + 5).forEach(app => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`app_start_${app.id}`)
                            .setLabel(`Aplicar a ${app.name}`.slice(0, 80))
                            .setStyle(ButtonStyle.Primary)
                    );
                });
                rows.push(row);
            }

            const messagePayload = { embeds: [embed], components: rows };
            let messageId = config.applicationsPanelMessageId;
            let action = "enviado";

            if (messageId) {
                try {
                    const existingMessage = await channel.messages.fetch(messageId);
                    await existingMessage.edit(messagePayload);
                    action = "actualizado";
                } catch (_) {
                    messageId = null;
                }
            }

            if (!messageId) {
                const sent = await channel.send(messagePayload);
                messageId = sent.id;
            }

            await updateGuildConfig(guildId, {
                applicationsPanelChannelId: channelId,
                applicationsPanelMessageId: messageId,
            });

            res.json({
                success: true,
                action,
                channelId,
                messageId,
            });
        } catch (error) {
            console.error("❌ Error al enviar panel de aplicaciones:", error);
            res.status(500).json({ error: "Error al enviar el panel" });
        }
    });

    // ══════════════════════════════════════
    // API: Dev Terminal (Activar Premium)
    // ══════════════════════════════════════
    app.post("/api/dev/premium/:guildId", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });
        
        // SOLO EL DEVELOPER PUEDE EJECUTAR ESTO
        const DEV_ID = "601394346826268673"; 
        if (req.session.user.id !== DEV_ID) {
            return res.status(403).json({ error: "Acceso denegado. Solo Developer." });
        }

        const { guildId } = req.params;
        const { isPremium } = req.body;

        try {
            await Guild.findOneAndUpdate(
                { guildId }, 
                { $set: { isPremium: isPremium === true } },
                { upsert: true }
            );
            invalidateCache(guildId);
            res.json({ success: true, isPremium });
        } catch (error) {
            res.status(500).json({ error: "Error al activar premium" });
        }
    });

    // ═══ Utilidades ═══
    async function hasAccess(user, guildId) {
        const MANAGE_GUILD = 0x20;
        const nativeAccess = user.guilds?.some(g => {
            return g.id === guildId && ((parseInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD || g.owner);
        });
        if (nativeAccess) return true;

        const config = await getGuildConfig(guildId);
        if (!config || !config.dashboardRoles || config.dashboardRoles.length === 0) return false;

        const guildObj = client.guilds.cache.get(guildId);
        if (!guildObj) return false;

        try {
            const member = await guildObj.members.fetch(user.id);
            if (member && member.roles.cache.some(r => config.dashboardRoles.includes(r.id))) {
                return true;
            }
        } catch(e) {}
        
        return false;
    }

    // ═══ Health Check (Railway) ═══
    app.get("/health", (req, res) => {
        res.status(200).send("OK");
    });

    // ═══ SPA fallback ═══
    app.get("/dashboard*", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "dashboard.html"));
    });

    // ═══ Iniciar ═══
    app.listen(PORT, () => {
        console.log(`🌐 Dashboard activo en: ${process.env.DASHBOARD_URL || `http://localhost:${PORT}`}`);
    });
}
