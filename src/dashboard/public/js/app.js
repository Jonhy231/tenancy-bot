// ═══════════════════════════════════════════
// TENANCY — Dashboard App
// ═══════════════════════════════════════════

let currentGuildId = null;
let serverData = null;
let guildRoles = [];
let guildChannels = { textChannels: [], categories: [] };

// Estado local de selección de roles
let selectedSupportRoles = [];
let selectedAdminRoles = [];
let selectedDashboardRoles = [];

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
        if (e.target.value) {
            currentGuildId = e.target.value;
            loadServerData(currentGuildId);
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
});

// ═══ Cargar Servidores ═══
async function loadServers() {
    try {
        const res = await fetch("/api/servers");
        const servers = await res.json();
        const selector = document.getElementById("serverSelector");

        if (!servers.length) {
            showView("noServersView");
            selector.innerHTML = '<option value="">Sin servidores</option>';
            return;
        }

        selector.innerHTML = servers.map(s =>
            `<option value="${s.id}">${s.name}</option>`
        ).join("");

        currentGuildId = servers[0].id;
        await loadServerData(currentGuildId);
    } catch (err) {
        console.error("Error cargando servidores:", err);
        toast("Error al cargar servidores", "error");
    }
}

// ═══ Cargar Datos del Servidor ═══
async function loadServerData(guildId) {
    showView("loadingView");
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
    document.getElementById("embedFooter").value = p.footer || "";
    document.getElementById("greetingText").value = data.config.ticketGreeting || "";
    updatePreview();
}

// ══════════════════════════════════════════
// ROLES: Selectores y Tags
// ══════════════════════════════════════════

function populateRoleSelectors() {
    const supportSelect = document.getElementById("supportRoleSelect");
    const adminSelect = document.getElementById("adminRoleSelect");
    const dashboardSelect = document.getElementById("dashboardRoleSelect");

    const buildOptions = (excludeIds) => {
        return '<option value="">+ Añadir rol...</option>' +
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
    catSelect.innerHTML = '<option value="">Sin categoría</option>' +
        guildChannels.categories.map(c =>
            `<option value="${c.id}" ${config.ticketCategoryId === c.id ? "selected" : ""}># ${c.name}</option>`
        ).join("");

    // Canales de texto (para logs y panel)
    const textOptions = guildChannels.textChannels.map(c => {
        const prefix = c.parentName ? `[${c.parentName}] ` : "";
        return { id: c.id, label: `${prefix}# ${c.name}` };
    });

    logSelect.innerHTML = '<option value="">Sin canal de logs</option>' +
        textOptions.map(c =>
            `<option value="${c.id}" ${config.logChannelId === c.id ? "selected" : ""}>${c.label}</option>`
        ).join("");

    panelSelect.innerHTML = '<option value="">Seleccionar canal...</option>' +
        textOptions.map(c =>
            `<option value="${c.id}" ${config.panelChannelId === c.id ? "selected" : ""}>${c.label}</option>`
        ).join("");
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
        statusText.textContent = `Panel activo en ${channelName}`;
        btnText.textContent = "Actualizar Panel";
    } else {
        statusDot.className = "status-dot status-inactive";
        statusText.textContent = "Sin panel enviado";
        btnText.textContent = "Enviar Panel";
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
// GUARDAR: Roles
// ══════════════════════════════════════════

async function saveRolesConfig() {
    const btn = document.getElementById("saveRolesBtn");
    btn.disabled = true;
    btn.textContent = "Guardando...";

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
        btn.textContent = "💾 Guardar Roles";
    }
}

// ══════════════════════════════════════════
// GUARDAR: Canales
// ══════════════════════════════════════════

async function saveChannelsConfig() {
    const btn = document.getElementById("saveChannelsBtn");
    btn.disabled = true;
    btn.textContent = "Guardando...";

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
        btn.textContent = "💾 Guardar Canales";
    }
}

// ═══ Render: Tickets recientes ═══
function renderRecentTickets(tickets) {
    const tbody = document.getElementById("recentTicketsTable");
    if (!tickets || !tickets.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin tickets aún</td></tr>';
        return;
    }
    tbody.innerHTML = tickets.slice(0, 10).map(t => `
        <tr>
            <td>#${String(t.ticketNumber).padStart(4, "0")}</td>
            <td>${t.userName || t.userId}</td>
            <td>${t.categoryName}</td>
            <td>${truncate(t.subject, 40)}</td>
            <td><span class="badge badge-${t.status}">${t.status === "open" ? "Abierto" : "Cerrado"}</span></td>
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
            : '<tr><td colspan="6" class="text-center text-muted">Sin usuarios baneados</td></tr>';
        return;
    }

    const tickets = (serverData.recentTickets || []).filter(t => t.status === filter);
    if (!tickets.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Sin tickets ${filter === "open" ? "abiertos" : "cerrados"}</td></tr>`;
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
        container.innerHTML = '<p class="text-muted">Sin categorías. Usa el botón + para añadir.</p>';
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
    if (!name) return toast("El nombre es obligatorio", "error");

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

// ═══ Guardar Personalización ═══
async function saveCustomization() {
    const btn = document.getElementById("saveCustomize");
    btn.disabled = true;
    btn.textContent = "Guardando...";

    const updates = {
        panelEmbed: {
            title: document.getElementById("embedTitle").value,
            description: document.getElementById("embedDescription").value,
            color: document.getElementById("embedColor").value,
            image: document.getElementById("embedImage").value,
            thumbnail: document.getElementById("embedThumbnail").value,
            footer: document.getElementById("embedFooter").value,
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
        toast("✅ Personalización guardada");
    } catch {
        toast("Error al guardar", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "💾 Guardar Cambios";
    }
}

// ═══ Preview en tiempo real ═══
function updatePreview() {
    const title = document.getElementById("embedTitle").value || "🎫 Sistema de Tickets";
    const desc = document.getElementById("embedDescription").value || "Selecciona una categoría...";
    const color = document.getElementById("embedColor").value || "#5865F2";
    const image = document.getElementById("embedImage").value;
    const thumb = document.getElementById("embedThumbnail").value;
    const footer = document.getElementById("embedFooter").value || "Sistema de soporte";

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
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}
