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
    const PORT = process.env.DASHBOARD_PORT || 3000;

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
        res.json({ id, username, avatar });
    });

    // ══════════════════════════════════════
    // API: Servidores
    // ══════════════════════════════════════

    // Listar servidores donde el usuario tiene permisos Y el bot está presente
    app.get("/api/servers", (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const userGuilds = req.session.user.guilds || [];
        const MANAGE_GUILD = 0x20; // Permission bit para Manage Guild

        const serversWithBot = userGuilds
            .filter(g => {
                // El usuario debe tener permisos de admin/manage
                const hasPerms = (parseInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD || g.owner;
                // El bot debe estar en ese servidor
                const botInGuild = client.guilds.cache.has(g.id);
                return hasPerms && botInGuild;
            })
            .map(g => {
                const guild = client.guilds.cache.get(g.id);
                return {
                    id: g.id,
                    name: guild?.name || g.name,
                    icon: guild?.iconURL({ size: 128 }) || null,
                    memberCount: guild?.memberCount || 0,
                };
            });

        res.json(serversWithBot);
    });

    // Obtener detalles de un servidor específico
    app.get("/api/server/:guildId", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const { guildId } = req.params;

        // Verificar permisos
        if (!hasAccess(req.session.user, guildId)) {
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

        res.json({
            guild: {
                id: guildId,
                name: guild?.name || config.guildName,
                icon: guild?.iconURL({ size: 128 }) || null,
                memberCount: guild?.memberCount || 0,
            },
            config: {
                ticketCategoryId: config.ticketCategoryId,
                transcriptChannelId: config.transcriptChannelId,
                logChannelId: config.logChannelId,
                supportRoles: config.supportRoles,
                adminRoles: config.adminRoles,
                panelEmbed: config.panelEmbed,
                panelChannelId: config.panelChannelId,
                panelMessageId: config.panelMessageId,
                ticketGreeting: config.ticketGreeting,
                categories: config.categories,
                bannedUsers: config.bannedUsers,
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
        if (!hasAccess(req.session.user, guildId)) {
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
        if (!hasAccess(req.session.user, guildId)) {
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
        if (!hasAccess(req.session.user, guildId)) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        // Lista blanca de campos editables
        const allowedFields = [
            "supportRoles", "adminRoles",
            "ticketCategoryId", "logChannelId", "transcriptChannelId",
            "panelChannelId", "panelEmbed", "ticketGreeting",
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
        if (!hasAccess(req.session.user, guildId)) {
            return res.status(403).json({ error: "Sin permisos" });
        }

        const { name, emoji, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "El nombre es obligatorio" });
        }

        const config = await getGuildConfig(guildId);

        if (config.categories.length >= 25) {
            return res.status(400).json({ error: "Máximo 25 categorías" });
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
        if (!hasAccess(req.session.user, guildId)) {
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
        if (!hasAccess(req.session.user, guildId)) {
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
            if (panel.footer) embed.setFooter({ text: panel.footer });

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

    // ═══ Utilidades ═══
    function hasAccess(user, guildId) {
        const MANAGE_GUILD = 0x20;
        return user.guilds?.some(g => {
            return g.id === guildId && ((parseInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD || g.owner);
        });
    }

    // ═══ SPA fallback ═══
    app.get("/dashboard*", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "dashboard.html"));
    });

    // ═══ Iniciar ═══
    app.listen(PORT, () => {
        console.log(`🌐 Dashboard activo en: ${process.env.DASHBOARD_URL || `http://localhost:${PORT}`}`);
    });
}
