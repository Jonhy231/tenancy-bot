import express from "express";
import session from "express-session";
import path from "path";
import fs from "fs";
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
    // Static: React dashboard build
    app.use("/dashboard", express.static(path.join(__dirname, "dist")));
    // Static: legacy public (landing page, etc.)
    app.use(express.static(path.join(__dirname, "public")));
    app.use(session({
        secret: process.env.SESSION_SECRET || "tenancy-bot-secret",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 24 * 60 * 60 * 1000 },
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

            res.redirect("/dashboard");
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
                ticketMode: config.ticketMode,
                customPanel: config.customPanel,
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
            "ticketMode", "customPanel",
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

            // ═══ Construir Mensaje según modo ═══
            let messagePayload;

            if (config.ticketMode === "custom" && config.customPanel?.buttons?.length > 0) {
                // —— Modo Personalizado: Embed con botón (Contact System) ——
                const cp = config.customPanel;
                const btnStyleMap = { primary: ButtonStyle.Primary, secondary: ButtonStyle.Secondary, success: ButtonStyle.Success, danger: ButtonStyle.Danger };

                const embed = new EmbedBuilder()
                    .setTitle(cp.title || "Contact System")
                    .setDescription(cp.description || "Selecciona una opción.")
                    .setColor(parseInt((cp.color || "#5865F2").replace("#", ""), 16));

                if (cp.banner) embed.setImage(cp.banner);

                // Campo de descripciones (izquierda)
                const descLines = cp.buttons
                    .filter(b => b.description)
                    .map(b => `**${b.label}:** ${b.description}`)
                    .join("\n");
                if (descLines) embed.addFields({ name: "DESCRIPCIÓN", value: descLines, inline: false });

                if (config.isPremium && cp.footer) embed.setFooter({ text: cp.footer });
                else if (!config.isPremium) embed.setFooter({ text: "⚡ Powered by Tenancy" });

                // Botón rows (máximo 5 por fila)
                const rows = [];
                for (let i = 0; i < cp.buttons.length; i += 5) {
                    const row = new ActionRowBuilder();
                    cp.buttons.slice(i, i + 5).forEach(btn => {
                        const b = new ButtonBuilder()
                            .setCustomId(`ticket_cat_${btn.id}`)
                            .setLabel(btn.label.substring(0, 80))
                            .setStyle(btnStyleMap[btn.color] || ButtonStyle.Primary);
                        if (btn.emoji) { try { b.setEmoji(btn.emoji); } catch (_) {} }
                        row.addComponents(b);
                    });
                    rows.push(row);
                }

                messagePayload = { embeds: [embed], components: rows };

            } else {
                // —— Modo Clásico: Embed + Select Menu ——
                if (!config.categories || config.categories.length === 0) {
                    return res.status(400).json({ error: "Debes crear al menos una categoría de tickets antes de enviar el panel" });
                }

                const panel = config.panelEmbed || {};
                const embed = new EmbedBuilder()
                    .setTitle(panel.title || "🎫 Sistema de Tickets")
                    .setDescription(panel.description || "Selecciona una categoría para abrir un ticket.")
                    .setColor(parseInt((panel.color || "#5865F2").replace("#", ""), 16))
                    .setTimestamp();

                if (panel.thumbnail) embed.setThumbnail(panel.thumbnail);
                if (panel.image) embed.setImage(panel.image);
                if (config.isPremium && panel.footer) embed.setFooter({ text: panel.footer });
                else embed.setFooter({ text: "⚡ Powered by Tenancy" });

                // Campos del embed
                if (panel.fields && panel.fields.length > 0) {
                    embed.addFields(panel.fields.map(f => ({ name: f.name || "\u200b", value: f.value || "\u200b", inline: f.inline || false })));
                }

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

                messagePayload = { embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] };
            }

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

            const channel = await guild.channels.fetch(channelId).catch(() => null);
            if (!channel) {
                return res.status(404).json({ error: "No se encontró el canal de destino en el servidor" });
            }

            if (!channel.isTextBased() || typeof channel.send !== "function") {
                return res.status(400).json({ error: "El canal seleccionado no admite mensajes normales. Usa un canal de texto." });
            }

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

            if (messageId && config.applicationsPanelChannelId === channelId) {
                try {
                    const existingMessage = await channel.messages.fetch(messageId);
                    await existingMessage.edit(messagePayload);
                    action = "actualizado";
                } catch (_) {
                    messageId = null;
                }
            } else {
                messageId = null;
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
            res.status(500).json({ error: "Error al enviar el panel de aplicaciones. Verifica que el bot pueda ver y enviar mensajes en ese canal." });
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

    // ══════════════════════════════════════
    // API: Dev Terminal — Ver Usage de Servidores
    // ══════════════════════════════════════
    app.get("/api/dev/servers", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

        const DEV_ID = "601394346826268673";
        if (req.session.user.id !== DEV_ID) {
            return res.status(403).json({ error: "Acceso denegado. Solo Developer." });
        }

        try {
            const guilds = await Guild.find({}).lean();
            const now = new Date();

            const serversData = guilds.map(g => {
                const resetDate = g.monthlyResetDate ? new Date(g.monthlyResetDate) : new Date(0);
                const needsReset = now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear();

                const guildObj = client.guilds.cache.get(g.guildId);
                return {
                    guildId: g.guildId,
                    guildName: guildObj?.name || g.guildName || "Desconocido",
                    guildIcon: guildObj?.iconURL({ size: 64 }) || null,
                    memberCount: guildObj?.memberCount || 0,
                    isPremium: g.isPremium || false,
                    totalTicketsCreated: g.totalTicketsCreated || 0,
                    monthlyTicketsUsed: needsReset ? 0 : (g.monthlyTicketsUsed || 0),
                    monthlyLimit: g.isPremium ? "∞" : 50,
                    monthlyResetDate: g.monthlyResetDate || null,
                    categoriesCount: g.categories?.length || 0,
                    ticketMode: g.ticketMode || "classic",
                };
            });

            serversData.sort((a, b) => b.monthlyTicketsUsed - a.monthlyTicketsUsed);
            res.json({ servers: serversData, total: serversData.length });
        } catch (error) {
            console.error("Error en dev/servers:", error);
            res.status(500).json({ error: "Error al obtener servidores" });
        }
    });

    // ══════════════════════════════════════
    // API: Dev Terminal — Simular Tickets (para testing)
    // ══════════════════════════════════════
    app.post("/api/dev/simulate-ticket/:guildId", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });
        const DEV_ID = "601394346826268673";
        if (req.session.user.id !== DEV_ID) {
            return res.status(403).json({ error: "Acceso denegado" });
        }

        const { guildId } = req.params;
        const { count = 1 } = req.body; // cuántos tickets simular

        try {
            const config = await getGuildConfig(guildId);
            const addCount = Math.min(Math.max(parseInt(count) || 1, 1), 50); // entre 1 y 50

            const newMonthly = (config.monthlyTicketsUsed || 0) + addCount;
            const newTotal = (config.totalTicketsCreated || 0) + addCount;

            await updateGuildConfig(guildId, {
                monthlyTicketsUsed: newMonthly,
                totalTicketsCreated: newTotal,
            });

            res.json({
                success: true,
                guildId,
                added: addCount,
                monthlyTicketsUsed: newMonthly,
                totalTicketsCreated: newTotal,
                limit: config.isPremium ? "∞" : 50,
                remaining: config.isPremium ? "∞" : Math.max(0, 50 - newMonthly),
            });
        } catch (error) {
            console.error("Error en simulate-ticket:", error);
            res.status(500).json({ error: "Error al simular ticket" });
        }
    });

    // ══════════════════════════════════════
    // API: Dev Terminal — Reset Manual del Contador Mensual
    // ══════════════════════════════════════
    app.post("/api/dev/reset-monthly/:guildId", async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: "No autenticado" });
        const DEV_ID = "601394346826268673";
        if (req.session.user.id !== DEV_ID) {
            return res.status(403).json({ error: "Acceso denegado" });
        }

        const { guildId } = req.params;
        try {
            await updateGuildConfig(guildId, {
                monthlyTicketsUsed: 0,
                monthlyResetDate: new Date(),
            });
            res.json({ success: true, guildId, monthlyTicketsUsed: 0 });
        } catch (error) {
            res.status(500).json({ error: "Error al resetear" });
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

    // ═══ Serve React Dashboard SPA ═══
    app.get("/dashboard*", (req, res) => {
        const distIndex = path.join(__dirname, "dist", "index.html");
        const legacyHtml = path.join(__dirname, "public", "dashboard.html");
        res.sendFile(fs.existsSync(distIndex) ? distIndex : legacyHtml);
    });

    // ═══ Landing page ═══
    app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

    // ═══ Iniciar ═══
    app.listen(PORT, () => {
        console.log(`🌐 Dashboard activo en: ${process.env.DASHBOARD_URL || `http://localhost:${PORT}`}`);
    });
}
