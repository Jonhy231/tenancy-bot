// ═══════════════════════════════════════════
// TENANCY — Dashboard App
// ═══════════════════════════════════════════

let currentGuildId = null;
let serverData = null;
let guildRoles = [];
let guildChannels = { textChannels: [], categories: [] };
let serversCache = { serversWithBot: [], serversWithoutBot: [] };
const webI18n = window.TenancyWebI18n || null;

// Estado local de selección de roles
let selectedSupportRoles = [];
let selectedAdminRoles = [];
let selectedDashboardRoles = [];

function tWeb(key, fallback, variables = {}) {
    if (webI18n && typeof webI18n.t === "function") {
        return webI18n.t(key, variables, fallback);
    }

    let text = fallback || key;
    for (const [name, value] of Object.entries(variables)) {
        text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
    }
    return text;
}

function applyWebTranslations() {
    if (webI18n && typeof webI18n.applyTranslations === "function") {
        webI18n.applyTranslations();
    }
}

// ═══ Init ═══
document.addEventListener("DOMContentLoaded", async () => {
    // Verificar autenticación
    try {
        const res = await fetch("/api/me");
        if (!res.ok) return window.location.href = "/";
        const user = await res.json();
        document.getElementById("userName").textContent = user.username;
        const avatarUrl = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;
        document.getElementById("userAvatar").src = avatarUrl;
        
        if (user.isDev) {
            const devBtn = document.getElementById("devNavBtn");
            if (devBtn) devBtn.style.display = "flex";
            const devSelBtn = document.getElementById("devSelectorBtn");
            if (devSelBtn) devSelBtn.style.display = "inline-flex";
        }
    } catch { return window.location.href = "/"; }

    // Cargar servidores
    await loadServers();

    // Eventos de navegación
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            switchView(item.dataset.view);
        });
    });

    // Evento: cambiar servidor
    document.getElementById("serverSelector").addEventListener("change", (e) => {
        if (!e.target.value) {
            currentGuildId = null;
            serverData = null;
            // Volver al selector de servidores
            document.getElementById("sidebar").style.display = "none";
            showView("serverSelectorView");
        } else {
            loadServerData(e.target.value);
        }
    });

    // Evento: tabs de tickets
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            renderTicketTable(tab.dataset.tab);
        });
    });

    // Evento: modal de categoría
    document.getElementById("addCategoryBtn").addEventListener("click", () => {
        document.getElementById("categoryModal").style.display = "flex";
    });
    document.getElementById("closeCategoryModal").addEventListener("click", closeModal);
    document.getElementById("cancelCategory").addEventListener("click", closeModal);
    document.getElementById("saveCategory").addEventListener("click", saveCategory);

    // Eventos: roles
    document.getElementById("supportRoleSelect").addEventListener("change", (e) => {
        if (e.target.value) {
            addRoleTag("support", e.target.value);
            e.target.value = "";
        }
    });
    document.getElementById("adminRoleSelect").addEventListener("change", (e) => {
        if (e.target.value) {
            addRoleTag("admin", e.target.value);
            e.target.value = "";
        }
    });
    const dashboardSelect = document.getElementById("dashboardRoleSelect");
    if (dashboardSelect) {
        dashboardSelect.addEventListener("change", (e) => {
            if (e.target.value) {
                addRoleTag("dashboard", e.target.value);
                e.target.value = "";
            }
        });
    }
    document.getElementById("saveRolesBtn").addEventListener("click", saveRolesConfig);

    // Eventos: canales
    document.getElementById("saveChannelsBtn").addEventListener("click", saveChannelsConfig);

    // Eventos: enviar panel
    document.getElementById("sendPanelBtn").addEventListener("click", sendPanel);

    // Eventos: personalización en tiempo real
    ["embedTitle", "embedDescription", "embedColor", "embedImage", "embedThumbnail", "embedFooter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", updatePreview);
    });
    document.getElementById("embedColorPicker").addEventListener("input", (e) => {
        document.getElementById("embedColor").value = e.target.value;
        updatePreview();
    });
    document.getElementById("embedColor").addEventListener("input", (e) => {
        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
            document.getElementById("embedColorPicker").value = e.target.value;
        }
        updatePreview();
    });

    // Evento: guardar personalización
    document.getElementById("saveCustomize").addEventListener("click", saveCustomization);

    // Evento: añadir campo de embed
    document.getElementById("addEmbedFieldBtn").addEventListener("click", () => {
        addEmbedFieldRow();
        updatePreview();
    });

    // Evento: Dev Terminal Premium
    const devPremiumBtn = document.getElementById("devPremiumBtn");
    if (devPremiumBtn) {
        devPremiumBtn.addEventListener("click", async () => {
            const gid = document.getElementById("devGuildIdInput").value.trim();
            const isPremium = document.getElementById("devPremiumStatus").value === "true";
            if (!gid) return toast("Introduce la ID del servidor", "error");

            try {
                const res = await fetch(`/api/dev/premium/${gid}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isPremium })
                });
                if (!res.ok) throw new Error();
                toast(`✅ Estado premium actualizado para ${gid}`);
                if (gid === currentGuildId) loadServerData(gid);
            } catch {
                toast("Error al actualizar premium", "error");
            }
        });
    }
    // Eventos: opciones generales
    const saveGeneralBtn = document.getElementById("saveGeneralBtn");
    if (saveGeneralBtn) saveGeneralBtn.addEventListener("click", saveGeneralConfig);

    // Eventos: aplicaciones
    const addAppBtn = document.getElementById("addAppBtn");
    if (addAppBtn) {
        addAppBtn.addEventListener("click", () => {
            document.getElementById("appModal").style.display = "flex";
        });
    }
    const closeAppModalBtn = document.getElementById("closeAppModal");
    if (closeAppModalBtn) closeAppModalBtn.addEventListener("click", closeAppModal);
    const cancelAppBtn = document.getElementById("cancelApp");
    if (cancelAppBtn) cancelAppBtn.addEventListener("click", closeAppModal);
    const saveAppBtn = document.getElementById("saveApp");
    if (saveAppBtn) saveAppBtn.addEventListener("click", saveApplication);
    
    const saveAppChannelBtn = document.getElementById("saveAppChannelBtn");
    if (saveAppChannelBtn) saveAppChannelBtn.addEventListener("click", saveAppChannelConfig);

    const sendAppPanelBtn = document.getElementById("sendAppPanelBtn");
    if (sendAppPanelBtn) sendAppPanelBtn.addEventListener("click", sendAppPanel);

    document.addEventListener("tenancy:language-changed", () => {
        renderServerSelector();
        if (serverData) {
            populateRoleSelectors();
            populateChannelSelectors(serverData.config);
            renderRecentTickets(serverData.recentTickets);
            renderTicketTable(document.querySelector(".tab.active")?.dataset.tab || "open");
            renderCategories(serverData.config.categories);
            renderApplications(serverData.config.applications);
            updatePanelStatus(serverData.config);
            updatePreview();
            const premiumNotice = document.getElementById("premiumNotice");
            if (premiumNotice) {
                premiumNotice.innerHTML = `<p style="color: var(--neon-cyan); margin-bottom: 0;">${tWeb("dashboard_premium_notice", "🔒 Actualiza a Premium para personalizar colores, eliminar la marca de agua y tener categorias infinitas. Paga con Binance Pay.")}</p>`;
            }
        }
    });

});

// ═══ Cargar Servidores ═══
async function loadServers() {
    try {
        const res = await fetch("/api/servers");
        serversCache = await res.json();
        renderServerSelector();

        // Mostrar vista del selector
        document.getElementById("sidebar").style.display = "none"; // Ocultar sidebar
        showView("serverSelectorView");
    } catch (err) {
        console.error("Error cargando servidores:", err);
        toast("Error al cargar servidores", "error");
    }
}

function renderServerSelector() {
    const { serversWithBot = [], serversWithoutBot = [] } = serversCache;
    const selector = document.getElementById("serverSelector");
    if (selector) {
        selector.innerHTML = `<option value="">${tWeb("dashboard_server_selector_option", "🏠 Selector de Servidores")}</option>` +
            serversWithBot.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
        if (currentGuildId) {
            selector.value = currentGuildId;
        }
    }

    const gridWith = document.getElementById("serversWithBotGrid");
    const gridWithout = document.getElementById("serversWithoutBotGrid");
    if (!gridWith || !gridWithout) return;

    if (serversWithBot.length === 0) {
        gridWith.innerHTML = `<p class="text-muted">${tWeb("dashboard_servers_with_bot_empty", "No tienes servidores con Tenancy instalado o no tienes permisos de administrador.")}</p>`;
    } else {
        gridWith.innerHTML = serversWithBot.map(s => `
                <div class="card server-node-card">
                    <div class="server-node-aura"></div>
                    <div class="server-node-head">
                        <img src="${s.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="Icon" class="server-node-avatar">
                        <div class="server-node-meta">
                            <span class="server-node-label">${tWeb("dashboard_live_workspace", "Workspace activo")}</span>
                            <h3>${s.name}</h3>
                            <p class="text-muted">${s.memberCount} ${tWeb("dashboard_members_label", "miembros")}</p>
                        </div>
                    </div>
                    <div class="server-node-actions">
                        <button class="btn btn-primary" style="width: 100%;" onclick="loadServerData('${s.id}')">${tWeb("dashboard_manage_btn", "Gestionar")}</button>
                    </div>
                </div>
            `).join("");
    }

    if (serversWithoutBot.length === 0) {
        gridWithout.innerHTML = `<p class="text-muted">${tWeb("dashboard_servers_without_bot_empty", "No tienes servidores pendientes.")}</p>`;
    } else {
        gridWithout.innerHTML = serversWithoutBot.map(s => `
                <div class="card server-node-card server-node-card-muted">
                    <div class="server-node-aura"></div>
                    <div class="server-node-head">
                        <img src="${s.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="Icon" class="server-node-avatar server-node-avatar-muted">
                        <div class="server-node-meta">
                            <span class="server-node-label">${tWeb("dashboard_pending_install", "Instalacion pendiente")}</span>
                            <h3>${s.name}</h3>
                            <p class="text-muted">${tWeb("dashboard_missing_install", "Falta instalar Tenancy")}</p>
                        </div>
                    </div>
                    <div class="server-node-actions">
                        <a href="https://discord.com/oauth2/authorize?client_id=1181289902558675026&permissions=8&scope=bot%20applications.commands&guild_id=${s.id}" target="_blank" class="btn btn-outline" style="width: 100%;">${tWeb("dashboard_invite_btn", "Invitar")}</a>
                    </div>
                </div>
            `).join("");
    }
}

// ═══ Cargar Datos del Servidor ═══
window.loadServerData = async function(guildId) {
    currentGuildId = guildId;
    document.getElementById("serverSelector").value = guildId;
    showView("loadingView");
    
    // Mostrar sidebar ahora que estamos en un servidor
    document.getElementById("sidebar").style.display = "flex";

    try {
        // Cargar todo en paralelo
        const [serverRes, rolesRes, channelsRes] = await Promise.all([
            fetch(`/api/server/${guildId}`),
            fetch(`/api/server/${guildId}/roles`),
            fetch(`/api/server/${guildId}/channels`),
        ]);

        serverData = await serverRes.json();
        guildRoles = await rolesRes.json();
        guildChannels = await channelsRes.json();

        populateDashboard(serverData);
        switchView("overview");
    } catch (err) {
        console.error("Error cargando servidor:", err);
        toast("Error al cargar datos del servidor", "error");
    }
}

// ═══ Poblar Dashboard ═══
function populateDashboard(data) {
    // Overview
    document.getElementById("serverName").textContent = data.guild.name;
    document.getElementById("statTotal").textContent = data.stats.totalTickets;
    document.getElementById("statOpen").textContent = data.stats.openTickets;
    document.getElementById("statClosed").textContent = data.stats.closedTickets;
    document.getElementById("statCategories").textContent = data.stats.categories;

    // Tickets tabs counts
    document.getElementById("tabOpenCount").textContent = data.stats.openTickets;
    document.getElementById("tabClosedCount").textContent = data.stats.closedTickets;
    document.getElementById("tabBannedCount").textContent = data.stats.bannedUsers;

    // Recent tickets table
    renderRecentTickets(data.recentTickets);

    // Config: categories
    renderCategories(data.config.categories);

    // Config: roles — poblar selectores y tags
    selectedSupportRoles = [...(data.config.supportRoles || [])];
    selectedAdminRoles = [...(data.config.adminRoles || [])];
    selectedDashboardRoles = [...(data.config.dashboardRoles || [])];
    populateRoleSelectors();
    renderRoleTags();

    // Config: Opciones Generales (i18n)
    const langSelect = document.getElementById("botLanguageSelect");
    if (langSelect) langSelect.value = data.config.language || "es";

    // Config: Aplicaciones
    renderApplications(data.config.applications);

    // Seguridad: Ocultar selectores sensibles si no es admin nativo
    if (data.guild.isNativeAdmin) {
        document.getElementById("adminRoleSelect").parentElement.parentElement.style.display = "block";
        document.getElementById("dashboardRoleGroup").style.display = "block";
    } else {
        document.getElementById("adminRoleSelect").parentElement.parentElement.style.display = "none";
        document.getElementById("dashboardRoleGroup").style.display = "none";
    }

    // Config: canales — poblar selectores
    populateChannelSelectors(data.config);

    // Config: estado del panel
    updatePanelStatus(data.config);

    // Customize: embed fields
    const p = data.config.panelEmbed || {};
    document.getElementById("embedTitle").value = p.title || "";
    document.getElementById("embedDescription").value = p.description || "";
    document.getElementById("embedColor").value = p.color || "#5865F2";
    document.getElementById("embedColorPicker").value = p.color || "#5865F2";
    document.getElementById("embedImage").value = p.image || "";
    document.getElementById("embedThumbnail").value = p.thumbnail || "";
    document.getElementById("embedFooter").value = data.guild.isPremium ? (p.footer || "") : "⚡ Powered by Tenancy";
    document.getElementById("greetingText").value = data.config.ticketGreeting || "";
    
    // Customize: embed fields (array)
    const fieldsContainer = document.getElementById("embedFieldsList");
    if (fieldsContainer) {
        fieldsContainer.innerHTML = "";
        const savedFields = Array.isArray(p.fields) ? p.fields : [];
        savedFields.forEach(f => addEmbedFieldRow(f.name, f.value, f.inline));
    }
    updatePreview();
    
    // Muro de Pago UI
    if (!data.guild.isPremium) {
        document.getElementById("embedFooter").disabled = true;
        document.getElementById("embedColor").disabled = true;
        document.getElementById("embedColorPicker").disabled = true;
        if (!document.getElementById("premiumNotice")) {
            const notice = document.createElement("div");
            notice.id = "premiumNotice";
            notice.className = "card-body";
            notice.style.background = "rgba(0, 255, 255, 0.1)";
            notice.style.borderBottom = "1px solid var(--neon-cyan)";
            notice.innerHTML = `<p style="color: var(--neon-cyan); margin-bottom: 0;">${tWeb("dashboard_premium_notice", "🔒 Actualiza a Premium para personalizar colores, eliminar la marca de agua y tener categorias infinitas. Paga con Binance Pay.")}</p>`;
            document.getElementById("embedTitle").parentElement.parentElement.prepend(notice);
        }
    } else {
        document.getElementById("embedFooter").disabled = false;
        document.getElementById("embedColor").disabled = false;
        document.getElementById("embedColorPicker").disabled = false;
        const notice = document.getElementById("premiumNotice");
        if (notice) notice.remove();
    }
    
    updatePreview();
    applyWebTranslations();
}

// ══════════════════════════════════════════
// ROLES: Selectores y Tags
// ══════════════════════════════════════════

function populateRoleSelectors() {
    const supportSelect = document.getElementById("supportRoleSelect");
    const adminSelect = document.getElementById("adminRoleSelect");
    const dashboardSelect = document.getElementById("dashboardRoleSelect");

    const buildOptions = (excludeIds) => {
        return `<option value="">${tWeb("dashboard_add_role_generic", "+ Añadir rol...")}</option>` +
            guildRoles
                .filter(r => !excludeIds.includes(r.id))
                .map(r => `<option value="${r.id}" style="color:${r.color}">${r.name}</option>`)
                .join("");
    };

    supportSelect.innerHTML = buildOptions(selectedSupportRoles);
    adminSelect.innerHTML = buildOptions(selectedAdminRoles);
    if (dashboardSelect) dashboardSelect.innerHTML = buildOptions(selectedDashboardRoles);
}

function renderRoleTags() {
    const supportContainer = document.getElementById("supportRoleTags");
    const adminContainer = document.getElementById("adminRoleTags");
    const dashboardContainer = document.getElementById("dashboardRoleTags");

    const buildTags = (roleIds, type) => {
        return roleIds.length
            ? roleIds.map(id => {
                const role = guildRoles.find(r => r.id === id);
                const name = role ? role.name : id;
                const color = role ? role.color : "#5865F2";
                return `<span class="role-tag" style="border-color:${color}; color:${color}">
                            ${name}
                            <button class="tag-remove" onclick="removeRoleTag('${type}','${id}')">&times;</button>
                        </span>`;
            }).join("")
            : '';
    };

    supportContainer.innerHTML = buildTags(selectedSupportRoles, "support");
    adminContainer.innerHTML = buildTags(selectedAdminRoles, "admin");
    if (dashboardContainer) dashboardContainer.innerHTML = buildTags(selectedDashboardRoles, "dashboard");
}

function addRoleTag(type, roleId) {
    if (type === "support" && !selectedSupportRoles.includes(roleId)) {
        selectedSupportRoles.push(roleId);
    } else if (type === "admin" && !selectedAdminRoles.includes(roleId)) {
        selectedAdminRoles.push(roleId);
    } else if (type === "dashboard" && !selectedDashboardRoles.includes(roleId)) {
        selectedDashboardRoles.push(roleId);
    }
    renderRoleTags();
    populateRoleSelectors();
}

window.removeRoleTag = function(type, roleId) {
    if (type === "support") {
        selectedSupportRoles = selectedSupportRoles.filter(id => id !== roleId);
    } else if (type === "admin") {
        selectedAdminRoles = selectedAdminRoles.filter(id => id !== roleId);
    } else if (type === "dashboard") {
        selectedDashboardRoles = selectedDashboardRoles.filter(id => id !== roleId);
    }
    renderRoleTags();
    populateRoleSelectors();
};

// ══════════════════════════════════════════
// CANALES: Selectores
// ══════════════════════════════════════════

function populateChannelSelectors(config) {
    const catSelect = document.getElementById("ticketCategorySelect");
    const logSelect = document.getElementById("logChannelSelect");
    const panelSelect = document.getElementById("panelChannelSelect");

    // Categorías de Discord (para organizar canales de tickets)
    catSelect.innerHTML = `<option value="">${tWeb("dashboard_no_category_option", "Sin categoría")}</option>` +
        guildChannels.categories.map(c =>
            `<option value="${c.id}" ${config.ticketCategoryId === c.id ? "selected" : ""}># ${c.name}</option>`
        ).join("");

    // Canales de texto (para logs y panel)
    const textOptions = guildChannels.textChannels.map(c => {
        const prefix = c.parentName ? `[${c.parentName}] ` : "";
        return { id: c.id, label: `${prefix}# ${c.name}` };
    });

    logSelect.innerHTML = `<option value="">${tWeb("dashboard_no_log_channel_option", "Sin canal de logs")}</option>` +
        textOptions.map(c =>
            `<option value="${c.id}" ${config.logChannelId === c.id ? "selected" : ""}>${c.label}</option>`
        ).join("");

    panelSelect.innerHTML = `<option value="">${tWeb("dashboard_select_channel_option", "Seleccionar canal...")}</option>` +
        textOptions.map(c =>
            `<option value="${c.id}" ${config.panelChannelId === c.id ? "selected" : ""}>${c.label}</option>`
        ).join("");
        
    const appSelect = document.getElementById("appChannelSelect");
    if (appSelect) {
        appSelect.innerHTML = `<option value="">${tWeb("dashboard_select_channel_option", "Seleccionar canal...")}</option>` +
            textOptions.map(c =>
                `<option value="${c.id}" ${config.applicationsChannelId === c.id ? "selected" : ""}>${c.label}</option>`
            ).join("");
    }

    const appPanelTargetSelect = document.getElementById("appPanelTargetSelect");
    if (appPanelTargetSelect) {
        appPanelTargetSelect.innerHTML = `<option value="">${tWeb("dashboard_select_channel_option", "Seleccionar canal...")}</option>` +
            textOptions.map(c => `<option value="${c.id}" ${config.applicationsPanelChannelId === c.id ? "selected" : ""}>${c.label}</option>`).join("");
    }
    
    // Poblar roles para aplicaciones
    const appRoleSelect = document.getElementById("appRoleToGive");
    if (appRoleSelect) {
        appRoleSelect.innerHTML = `<option value="">${tWeb("dashboard_app_role_none", "Ninguno")}</option>` +
            guildRoles.map(r => `<option value="${r.id}" style="color:${r.color}">${r.name}</option>`).join("");
    }
}

// ══════════════════════════════════════════
// PANEL: Estado y Envío
// ══════════════════════════════════════════

function updatePanelStatus(config) {
    const statusDot = document.querySelector(".status-dot");
    const statusText = document.getElementById("panelStatusText");
    const btnText = document.getElementById("sendPanelBtnText");

    if (config.panelMessageId && config.panelChannelId) {
        statusDot.className = "status-dot status-active";
        const channel = guildChannels.textChannels.find(c => c.id === config.panelChannelId);
        const channelName = channel ? `#${channel.name}` : config.panelChannelId;
        statusText.textContent = tWeb("dashboard_panel_status_active", "Panel activo en {channelName}", { channelName });
        btnText.textContent = tWeb("dashboard_panel_update_btn", "Actualizar Panel");
    } else {
        statusDot.className = "status-dot status-inactive";
        statusText.textContent = tWeb("dashboard_panel_status_inactive", "Sin panel enviado");
        btnText.textContent = tWeb("dashboard_panel_send_btn", "Enviar Panel");
    }
}

async function sendPanel() {
    const btn = document.getElementById("sendPanelBtn");
    const content = btn.querySelector(".btn-content");
    const loader = btn.querySelector(".btn-loader");

    // Validar canal del panel
    const panelChannelId = document.getElementById("panelChannelSelect").value;
    if (!panelChannelId) {
        toast("Selecciona un canal para el panel en la sección de Canales", "error");
        return;
    }

    // Primero guardar el canal del panel si cambió
    try {
        await fetch(`/api/server/${currentGuildId}/config`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ panelChannelId }),
        });
    } catch { /* se continúa igualmente */ }

    // Mostrar loading
    btn.disabled = true;
    content.style.display = "none";
    loader.style.display = "inline-flex";

    try {
        const res = await fetch(`/api/server/${currentGuildId}/panel/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const result = await res.json();

        if (!res.ok) {
            toast(result.error || "Error al enviar el panel", "error");
            return;
        }

        const actionText = result.action === "actualizado" ? "actualizado" : "enviado";
        toast(`✅ Panel ${actionText} correctamente`);

        // Actualizar estado del panel
        await loadServerData(currentGuildId);
    } catch {
        toast("Error de conexión al enviar el panel", "error");
    } finally {
        btn.disabled = false;
        content.style.display = "inline-flex";
        loader.style.display = "none";
    }
}

// ══════════════════════════════════════════
// GUARDAR: General e Idioma
// ══════════════════════════════════════════

async function saveGeneralConfig() {
    const btn = document.getElementById("saveGeneralBtn");
    btn.disabled = true;
    btn.textContent = tWeb("saving_generic", "Guardando...");

    try {
        const res = await fetch(`/api/server/${currentGuildId}/config`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: document.getElementById("botLanguageSelect").value
            }),
        });
        if (!res.ok) throw new Error();
        toast("✅ Opciones generales guardadas");
    } catch {
        toast("Error al guardar opciones generales", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = tWeb("btn_save_general", "💾 Guardar General");
    }
}

// ══════════════════════════════════════════
// GUARDAR: Roles
// ══════════════════════════════════════════

async function saveRolesConfig() {
    const btn = document.getElementById("saveRolesBtn");
    btn.disabled = true;
    btn.textContent = tWeb("saving_generic", "Guardando...");

    try {
        const res = await fetch(`/api/server/${currentGuildId}/config`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                supportRoles: selectedSupportRoles,
                adminRoles: selectedAdminRoles,
                dashboardRoles: selectedDashboardRoles,
            }),
        });
        if (!res.ok) throw new Error();
        toast("✅ Roles guardados correctamente");
    } catch {
        toast("Error al guardar roles", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = tWeb("btn_save_roles", "💾 Guardar Roles");
    }
}

// ══════════════════════════════════════════
// GUARDAR: Canales
// ══════════════════════════════════════════

async function saveChannelsConfig() {
    const btn = document.getElementById("saveChannelsBtn");
    btn.disabled = true;
    btn.textContent = tWeb("saving_generic", "Guardando...");

    try {
        const res = await fetch(`/api/server/${currentGuildId}/config`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ticketCategoryId: document.getElementById("ticketCategorySelect").value,
                logChannelId: document.getElementById("logChannelSelect").value,
                panelChannelId: document.getElementById("panelChannelSelect").value,
            }),
        });
        if (!res.ok) throw new Error();
        toast("✅ Canales guardados correctamente");
    } catch {
        toast("Error al guardar canales", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = tWeb("btn_save_channels", "💾 Guardar Canales");
    }
}

// ═══ Render: Tickets recientes ═══
function renderRecentTickets(tickets) {
    const tbody = document.getElementById("recentTicketsTable");
    if (!tickets || !tickets.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${tWeb("dashboard_no_tickets_yet", "Sin tickets aún")}</td></tr>`;
        return;
    }
    tbody.innerHTML = tickets.slice(0, 10).map(t => `
        <tr>
            <td>#${String(t.ticketNumber).padStart(4, "0")}</td>
            <td>${t.userName || t.userId}</td>
            <td>${t.categoryName}</td>
            <td>${truncate(t.subject, 40)}</td>
            <td><span class="badge badge-${t.status}">${t.status === "open" ? tWeb("status_open", "Abierto") : tWeb("status_closed", "Cerrado")}</span></td>
            <td>${formatDate(t.createdAt)}</td>
        </tr>
    `).join("");
}

// ═══ Render: Tabla de tickets filtrada ═══
function renderTicketTable(filter) {
    const tbody = document.getElementById("ticketsTableBody");
    if (!serverData) return;

    if (filter === "banned") {
        const banned = serverData.config.bannedUsers || [];
        tbody.innerHTML = banned.length
            ? banned.map(u => `<tr><td colspan="6">${u}</td></tr>`).join("")
            : `<tr><td colspan="6" class="text-center text-muted">${tWeb("dashboard_no_banned_users", "Sin usuarios baneados")}</td></tr>`;
        return;
    }

    const tickets = (serverData.recentTickets || []).filter(t => t.status === filter);
    if (!tickets.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${filter === "open" ? tWeb("dashboard_no_open_tickets", "Sin tickets abiertos") : tWeb("dashboard_no_closed_tickets", "Sin tickets cerrados")}</td></tr>`;
        return;
    }
    tbody.innerHTML = tickets.map(t => `
        <tr>
            <td>#${String(t.ticketNumber).padStart(4, "0")}</td>
            <td>${t.userName || t.userId}</td>
            <td>${t.categoryName}</td>
            <td>${truncate(t.subject, 40)}</td>
            <td>${t.claimedByName || "—"}</td>
            <td>${formatDate(t.createdAt)}</td>
        </tr>
    `).join("");
}

// ═══ Render: Categorías ═══
function renderCategories(categories) {
    const container = document.getElementById("categoriesList");
    if (!categories || !categories.length) {
        container.innerHTML = `<p class="text-muted">${tWeb("dashboard_no_categories", "Sin categorías. Usa el botón + para añadir.")}</p>`;
        return;
    }
    container.innerHTML = categories.map(c => `
        <div class="category-item">
            <div class="category-info">
                <span class="category-emoji">${c.emoji}</span>
                <div>
                    <div class="category-name">${c.name}</div>
                    <div class="category-desc">${c.description}</div>
                </div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory('${c.id}')">🗑️</button>
        </div>
    `).join("");
}

// ═══ Guardar Categoría ═══
async function saveCategory() {
    const name = document.getElementById("catName").value.trim();
    if (!name) return toast(tWeb("validation_name_required", "El nombre es obligatorio"), "error");

    try {
        const res = await fetch(`/api/server/${currentGuildId}/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                emoji: document.getElementById("catEmoji").value || "🎫",
                description: document.getElementById("catDesc").value || "Soporte",
            }),
        });
        const result = await res.json();
        if (!res.ok) {
            toast(result.error || "Error al guardar categoría", "error");
            return;
        }
        toast("✅ Categoría añadida");
        closeModal();
        await loadServerData(currentGuildId);
    } catch { toast("Error al guardar categoría", "error"); }
}

// ═══ Eliminar Categoría ═══
window.deleteCategory = async function(catId) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
        await fetch(`/api/server/${currentGuildId}/categories/${catId}`, { method: "DELETE" });
        toast("🗑️ Categoría eliminada");
        await loadServerData(currentGuildId);
    } catch { toast("Error al eliminar", "error"); }
};

// ═══ Render: Aplicaciones ═══
function renderApplications(applications) {
    const container = document.getElementById("applicationsList");
    if (!container) return;
    if (!applications || !applications.length) {
        container.innerHTML = `<p class="text-muted">${tWeb("dashboard_no_applications", "No hay formularios creados. Usa el botón + para añadir uno.")}</p>`;
        return;
    }

    const validApplications = applications.filter(a => a && (a.name || a.id));
    if (!validApplications.length) {
        container.innerHTML = `<p class="text-muted">${tWeb("dashboard_no_applications", "No hay formularios creados. Usa el botón + para añadir uno.")}</p>`;
        return;
    }

    container.innerHTML = validApplications.map(a => {
        const questions = Array.isArray(a.questions) ? a.questions.filter(Boolean) : [];
        const role = guildRoles.find(r => r.id === a.roleToGive);
        const roleLabel = role ? role.name : (a.roleToGive ? a.roleToGive : tWeb("dashboard_app_role_none", "Ninguno"));
        const questionMarkup = questions.length
            ? questions.map((question, index) => `<span class="app-question-chip">Q${index + 1} · ${question}</span>`).join("")
            : `<span class="app-question-chip">${tWeb("validation_one_question", "Añade al menos 1 pregunta")}</span>`;

        return `
        <div class="application-card">
            <div class="application-card-accent"></div>
            <div class="application-card-head">
                <div>
                    <div class="application-card-kicker">${tWeb("dashboard_app_flow_label", "Flujo de postulacion")}</div>
                    <div class="category-name application-card-title">${a.name}</div>
                    <div class="category-desc application-card-meta">
                        ${questions.length} ${tWeb("dashboard_questions_label", "preguntas")} • ${tWeb("dashboard_role_label", "Rol")}: ${roleLabel}
                    </div>
                </div>
                <span class="app-role-pill">${roleLabel}</span>
            </div>
            <div class="app-question-list">
                ${questionMarkup}
            </div>
            <div class="application-card-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteApplication('${a.id}')">🗑️</button>
            </div>
        </div>
    `;
    }).join("");
}

function closeAppModal() {
    document.getElementById("appModal").style.display = "none";
    document.getElementById("appName").value = "";
    document.getElementById("appRoleToGive").value = "";
    document.querySelectorAll(".app-question-input").forEach(i => i.value = "");
}

async function saveApplication() {
    const name = document.getElementById("appName").value.trim();
    if (!name) return toast(tWeb("validation_name_required", "El nombre es obligatorio"), "error");

    const questions = Array.from(document.querySelectorAll(".app-question-input"))
        .map(i => i.value.trim())
        .filter(q => q !== "");

    if (questions.length === 0) return toast(tWeb("validation_one_question", "Añade al menos 1 pregunta"), "error");

    const roleToGive = document.getElementById("appRoleToGive").value;
    const appId = "app_" + Date.now();

    const newApp = { id: appId, name, questions: questions.slice(0, 5), roleToGive };
    
    const currentApps = Array.isArray(serverData?.config?.applications) ? [...serverData.config.applications] : [];
    currentApps.push(newApp);

    try {
        const res = await fetch(`/api/server/${currentGuildId}/config`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ applications: currentApps }),
        });
        if (!res.ok) throw new Error();
        toast("✅ Formulario creado");
        closeAppModal();
        await loadServerData(currentGuildId);
    } catch {
        toast("Error al guardar formulario", "error");
    }
}

window.deleteApplication = async function(appId) {
    if (!confirm("¿Eliminar este formulario?")) return;
    const currentApps = serverData.config.applications || [];
    const newApps = currentApps.filter(a => a.id !== appId);

    try {
        const res = await fetch(`/api/server/${currentGuildId}/config`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ applications: newApps }),
        });
        if (!res.ok) throw new Error();
        toast("🗑️ Formulario eliminado");
        await loadServerData(currentGuildId);
    } catch {
        toast("Error al eliminar", "error");
    }
};

async function saveAppChannelConfig() {
    const btn = document.getElementById("saveAppChannelBtn");
    btn.disabled = true;
    btn.textContent = tWeb("saving_generic", "Guardando...");

    try {
        const res = await fetch(`/api/server/${currentGuildId}/config`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                applicationsChannelId: document.getElementById("appChannelSelect").value,
            }),
        });
        if (!res.ok) throw new Error();
        toast("✅ Canal de aplicaciones guardado");
    } catch {
        toast("Error al guardar", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = tWeb("btn_save_channel", "💾 Guardar Canal");
    }
}

async function sendAppPanel() {
    const targetChannelId = document.getElementById("appPanelTargetSelect").value;
    if (!targetChannelId) return toast(tWeb("validation_target_channel", "Selecciona un canal de destino para publicar el panel"), "error");

    const btn = document.getElementById("sendAppPanelBtn");
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = tWeb("sending_generic", "Enviando...");

    try {
        const res = await fetch(`/api/server/${currentGuildId}/panel-app/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetChannelId }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Error al enviar");
        
        const actionText = data.action === "actualizado"
            ? tWeb("dashboard_panel_updated", "actualizado")
            : tWeb("dashboard_panel_sent", "enviado");
        toast(`✅ ${tWeb("dashboard_app_panel_success", "Panel de aplicaciones {action} correctamente", { action: actionText })}`);
        await loadServerData(currentGuildId);
    } catch (error) {
        toast(error.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

// ═══ Gestión de Campos del Embed ═══
function addEmbedFieldRow(name = "", value = "", inline = false) {
    const container = document.getElementById("embedFieldsList");
    if (!container) return;
    const count = container.querySelectorAll(".embed-field-row").length;
    if (count >= 6) { toast("Máximo 6 campos permitidos", "error"); return; }
    const row = document.createElement("div");
    row.className = "embed-field-row";
    row.style.cssText = "display:grid; grid-template-columns: 1fr 1fr auto auto; gap:0.5rem; align-items:center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius:8px; padding:0.6rem 0.8rem;";
    row.innerHTML = `
        <input type="text" class="form-input ef-name" placeholder="Nombre del campo" value="${name.replace(/"/g,'&quot;')}" style="font-size:0.85rem; padding:0.4rem 0.6rem;">
        <input type="text" class="form-input ef-value" placeholder="Valor del campo" value="${value.replace(/"/g,'&quot;')}" style="font-size:0.85rem; padding:0.4rem 0.6rem;">
        <label style="display:flex; align-items:center; gap:0.3rem; font-size:0.8rem; color:#a0a8c2; white-space:nowrap; cursor:pointer;">
            <input type="checkbox" class="ef-inline" ${inline ? 'checked' : ''}> En línea
        </label>
        <button type="button" class="btn btn-sm" style="background:rgba(255,50,50,0.15); border-color:rgba(255,50,50,0.4); color:#ff6b6b; padding:0.3rem 0.6rem;" onclick="this.closest('.embed-field-row').remove(); updatePreview();">✕</button>
    `;
    row.querySelectorAll("input").forEach(inp => inp.addEventListener("input", updatePreview));
    container.appendChild(row);
}

// ═══ Guardar Personalización ═══
async function saveCustomization() {
    const btn = document.getElementById("saveCustomize");
    btn.disabled = true;
    btn.textContent = tWeb("saving_generic", "Guardando...");

    // Collect embed fields
    const embedFields = [];
    document.querySelectorAll(".embed-field-row").forEach(row => {
        const name = row.querySelector(".ef-name").value.trim();
        const value = row.querySelector(".ef-value").value.trim();
        const inline = row.querySelector(".ef-inline").checked;
        if (name || value) embedFields.push({ name, value, inline });
    });

    const updates = {
        panelEmbed: {
            title: document.getElementById("embedTitle").value,
            description: document.getElementById("embedDescription").value,
            color: document.getElementById("embedColor").value,
            image: document.getElementById("embedImage").value,
            thumbnail: document.getElementById("embedThumbnail").value,
            footer: document.getElementById("embedFooter").value,
            fields: embedFields,
        },
        ticketGreeting: document.getElementById("greetingText").value,
    };

    try {
        const res = await fetch(`/api/server/${currentGuildId}/config`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error();
        // Actualizar caché local para que al volver a la vista los datos sean correctos
        if (serverData && serverData.config) {
            serverData.config.panelEmbed = updates.panelEmbed;
            serverData.config.ticketGreeting = updates.ticketGreeting;
        }
        toast("✅ Personalización guardada");
    } catch {
        toast("Error al guardar", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = tWeb("btn_save_changes", "💾 Guardar Cambios");
    }
}

// ═══ Preview en tiempo real ═══
function updatePreview() {
    const title = document.getElementById("embedTitle").value || tWeb("preview_default_title", "🎫 Sistema de Tickets");
    const desc = document.getElementById("embedDescription").value || tWeb("preview_default_desc", "Selecciona una categoría...");
    const color = document.getElementById("embedColor").value || "#5865F2";
    const image = document.getElementById("embedImage").value;
    const thumb = document.getElementById("embedThumbnail").value;
    const footer = document.getElementById("embedFooter").value || tWeb("preview_default_footer", "Sistema de soporte");

    document.getElementById("embedPreviewTitle").textContent = title;
    document.getElementById("embedPreviewDesc").textContent = desc;
    document.getElementById("embedPreviewBar").style.background = color;
    document.getElementById("embedPreviewFooter").textContent = footer;

    const imgEl = document.getElementById("embedPreviewImage");
    if (image) { imgEl.src = image; imgEl.style.display = "block"; }
    else { imgEl.style.display = "none"; }

    const thumbEl = document.getElementById("embedPreviewThumb");
    if (thumb) { thumbEl.src = thumb; thumbEl.style.display = "block"; }
    else { thumbEl.style.display = "none"; }

    // Render fields in preview
    const fieldsPreview = document.getElementById("embedPreviewFields");
    if (fieldsPreview) {
        const fieldRows = document.querySelectorAll(".embed-field-row");
        const fieldsData = [];
        fieldRows.forEach(row => {
            const name = row.querySelector(".ef-name").value.trim();
            const val = row.querySelector(".ef-value").value.trim();
            const inline = row.querySelector(".ef-inline").checked;
            if (name || val) fieldsData.push({ name, value: val, inline });
        });
        if (fieldsData.length > 0) {
            fieldsPreview.style.display = "block";
            // Group inline fields in rows of 3
            let html = '<div class="embed-fields-grid">';
            fieldsData.forEach(field => {
                html += `<div class="embed-field${field.inline ? ' ef-inline-field' : ' ef-block-field'}">
                    <div class="ef-preview-name">${field.name || '\u200b'}</div>
                    <div class="ef-preview-value">${field.value || '\u200b'}</div>
                </div>`;
            });
            html += '</div>';
            fieldsPreview.innerHTML = html;
        } else {
            fieldsPreview.style.display = "none";
            fieldsPreview.innerHTML = "";
        }
    }
}

// ═══ Navegación ═══
function switchView(viewName) {
    document.querySelectorAll(".view").forEach(v => {
        v.style.display = "none";
        v.classList.remove("active-view");
    });
    const target = document.getElementById(viewName + "View");
    if (target) { target.style.display = "block"; target.classList.add("active-view"); }

    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (navItem) navItem.classList.add("active");

    if (viewName === "tickets") renderTicketTable("open");
}

function showView(id) {
    document.querySelectorAll(".view").forEach(v => { v.style.display = "none"; v.classList.remove("active-view"); });
    const el = document.getElementById(id);
    if (el) { el.style.display = "block"; el.classList.add("active-view"); }
}

// ═══ Utilidades ═══
function closeModal() {
    document.getElementById("categoryModal").style.display = "none";
    document.getElementById("catName").value = "";
    document.getElementById("catEmoji").value = "";
    document.getElementById("catDesc").value = "";
}

function toast(msg, type = "success") {
    const container = document.getElementById("toastContainer");
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function truncate(str, len) {
    if (!str) return "—";
    return str.length > len ? str.slice(0, len) + "…" : str;
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const locale = webI18n && typeof webI18n.getLanguage === "function" && webI18n.getLanguage() === "en" ? "en-US" : "es-ES";
    return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

// ═══ Dev Terminal Global ═══
window.showDevTerminalGlobal = function() {
    document.getElementById("sidebar").style.display = "flex"; // Show sidebar so dev can navigate back
    const selector = document.getElementById("serverSelector");
    if(selector) selector.value = "";

    showView("devTerminalView");
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    const navItem = document.querySelector(`.nav-item[data-view="devTerminal"]`);
    if (navItem) navItem.classList.add("active");
}
