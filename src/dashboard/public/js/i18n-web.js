(function initTenancyWebI18n() {
    const STORAGE_KEY = "tenancy_web_language";

    const dictionaries = {
        es: {
            landing_page_title: "Tenancy - El Sistema de Soporte Definitivo",
            nav_contact: "Contacto",
            nav_docs: "Docs",
            nav_invite: "Invitar Bot",
            nav_panel: "Panel Web",
            nav_logout: "Salir",
            landing_hero_title: "Tenancy Bot",
            hero_desc: "Tu solucion definitiva para la gestion de tickets. Tenancy facilita el soporte de tu servidor con un panel web intuitivo, personalizacion avanzada y constantes actualizaciones para mejorar la experiencia de tu comunidad.",
            btn_access_panel: "Acceder al Panel",
            btn_invite_bot: "Invitar Bot",
            landing_docs_title: "Documentacion Rapida",
            landing_docs_subtitle: "Aprende a configurar Tenancy en 3 pasos.",
            landing_step1_title: "Invita al bot",
            landing_step1_desc: "Agrega el bot a tu servidor y dale permisos de Administrador para que pueda crear canales de tickets libremente.",
            landing_step2_title: "Roles y Canales",
            landing_step2_desc: "Entra al Panel Web y ve a Configuracion. Asigna que roles pueden atender tickets y donde se crearan los logs.",
            landing_step3_title: "Envia el Panel",
            landing_step3_desc: "Crea tus categorias y desde el panel web envia el embed a tu canal de soporte. Tus usuarios ya pueden abrir tickets.",
            landing_footer: "Tenancy Bot © 2026. Todos los derechos reservados.",
            dashboard_page_title: "Dashboard - Tenancy",
            dashboard_loading_servers: "Cargando servidores...",
            dashboard_loading_data: "Cargando datos...",
            sidebar_overview: "MONITOR_SYS",
            sidebar_tickets: "TICKETS_DB",
            sidebar_config: "SYS_CONFIG",
            sidebar_customize: "UI_OVERRIDE",
            sidebar_applications: "APPLIC_SYS",
            sidebar_dev: "DEV_TERMINAL",
            dashboard_server_selector_title: "Selector de Servidores",
            dashboard_server_selector_subtitle: "Selecciona un servidor para gestionar Tenancy o invita al bot a uno nuevo.",
            dashboard_servers_with_bot: "Servidores con Tenancy",
            dashboard_servers_without_bot: "Servidores sin Tenancy",
            dashboard_overview_title: "VISTA GENERAL",
            dashboard_stat_total: "Total Tickets",
            dashboard_stat_open: "Tickets Abiertos",
            dashboard_stat_closed: "Tickets Cerrados",
            dashboard_stat_categories: "Categorias",
            dashboard_recent_tickets: "TICKETS RECIENTES",
            dashboard_tickets_title: "GESTION DE TICKETS",
            dashboard_config_title: "SYS_CONFIG",
            dashboard_config_subtitle: "PARAMETROS DE INSTANCIA LOCAL",
            dashboard_general_options: "🌐 Opciones Generales",
            dashboard_bot_language: "Idioma del Bot",
            dashboard_bot_language_help: "Cambia el idioma de los comandos, modales y mensajes.",
            dashboard_staff_roles: "👥 Roles de Staff",
            dashboard_support_roles: "Roles de Soporte",
            dashboard_support_roles_help: "Pueden ver y gestionar tickets",
            dashboard_add_support_role: "+ Añadir rol de soporte...",
            dashboard_admin_roles: "Roles de Admin",
            dashboard_admin_roles_help: "Acceso total a tickets y configuracion",
            dashboard_add_admin_role: "+ Añadir rol de admin...",
            dashboard_dashboard_roles: "Roles de Acceso al Dashboard",
            dashboard_dashboard_roles_help: "Pueden entrar a este panel web y configurar el bot",
            dashboard_add_dashboard_role: "+ Añadir rol de dashboard...",
            dashboard_add_role_generic: "+ Añadir rol...",
            dashboard_channels: "📁 Canales",
            dashboard_ticket_category: "Categoria de Discord para Tickets",
            dashboard_ticket_category_help: "Los canales de tickets se crearan dentro de esta categoria",
            dashboard_log_channel: "Canal de Logs",
            dashboard_log_channel_help: "Canal donde se envian los logs de tickets cerrados",
            dashboard_panel_channel: "Canal del Panel",
            dashboard_panel_channel_help: "Canal donde se enviara o actualizara el panel de tickets",
            dashboard_ticket_categories: "🏷️ Categorias de Tickets",
            dashboard_ticket_panel: "📋 Panel de Tickets",
            dashboard_ticket_panel_help: "Envia o actualiza el panel de tickets en el canal configurado. El panel refleja las categorias y el diseño de la seccion de Personalizacion.",
            dashboard_panel_status_inactive: "Sin panel enviado",
            dashboard_panel_status_active: "Panel activo en {channelName}",
            dashboard_panel_send_btn: "Enviar Panel",
            dashboard_panel_update_btn: "Actualizar Panel",
            dashboard_customize_title: "UI_OVERRIDE",
            dashboard_customize_subtitle: "CONFIGURACION VISUAL DEL EMBED",
            dashboard_embed_editor: "Editor del Embed",
            dashboard_greeting_variables: "Variables: {user}, {subject}, {category}",
            dashboard_preview: "Vista Previa",
            dashboard_applications_title: "APPLIC_SYS",
            dashboard_applications_subtitle: "FORMULARIOS DE STAFF",
            dashboard_app_channel_title: "📁 Canal de Aplicaciones",
            dashboard_app_channel_label: "Canal para recibir formularios",
            dashboard_app_channel_help: "Canal privado donde los admins veran y aceptaran o rechazaran aplicaciones",
            dashboard_send_app_panel_title: "📤 Enviar Panel de Aplicaciones",
            dashboard_app_panel_channel_label: "Canal donde se publicara el panel",
            dashboard_app_panel_channel_help: "Canal publico donde los usuarios pulsaran los botones para postularse.",
            dashboard_created_forms: "📋 Formularios Creados",
            dashboard_app_name_label: "Nombre del Puesto (Ej: Moderador)",
            dashboard_app_role_to_give: "Rol a otorgar si es Aceptado",
            dashboard_app_role_none: "Ninguno",
            dashboard_questions_max: "Preguntas (Max 5)",
            dashboard_server_selector_option: "🏠 Selector de Servidores",
            dashboard_no_category_option: "Sin categoria",
            dashboard_no_log_channel_option: "Sin canal de logs",
            dashboard_select_channel_option: "Seleccionar canal...",
            dashboard_servers_with_bot_empty: "No tienes servidores con Tenancy instalado o no tienes permisos de administrador.",
            dashboard_servers_without_bot_empty: "No tienes servidores pendientes.",
            dashboard_members_label: "miembros",
            dashboard_manage_btn: "Gestionar",
            dashboard_missing_install: "Falta instalar Tenancy",
            dashboard_invite_btn: "Invitar",
            dashboard_no_tickets_yet: "Sin tickets aun",
            dashboard_no_banned_users: "Sin usuarios baneados",
            dashboard_no_open_tickets: "Sin tickets abiertos",
            dashboard_no_closed_tickets: "Sin tickets cerrados",
            dashboard_no_categories: "Sin categorias. Usa el boton + para añadir.",
            dashboard_no_applications: "No hay formularios creados. Usa el boton + para añadir uno.",
            dashboard_questions_label: "preguntas",
            dashboard_role_label: "Rol",
            dashboard_panel_updated: "actualizado",
            dashboard_panel_sent: "enviado",
            dashboard_app_panel_success: "Panel de aplicaciones {action} correctamente",
            dashboard_premium_notice: "🔒 Actualiza a Premium para personalizar colores, eliminar la marca de agua y tener categorias infinitas. Paga con Binance Pay.",
            table_user: "Usuario",
            table_category: "Categoria",
            table_subject: "Asunto",
            table_status: "Estado",
            table_date: "Fecha",
            table_claimed: "Reclamado",
            tab_open: "🟢 Abiertos",
            tab_closed: "🔴 Cerrados",
            tab_banned: "🚫 Baneados",
            status_open: "Abierto",
            status_closed: "Cerrado",
            btn_save_general: "💾 Guardar General",
            btn_save_roles: "💾 Guardar Roles",
            btn_save_channels: "💾 Guardar Canales",
            btn_add: "+ Añadir",
            btn_save_changes: "💾 Guardar Cambios",
            btn_save_channel: "💾 Guardar Canal",
            btn_new_form: "+ Nuevo Formulario",
            btn_cancel: "Cancelar",
            btn_save: "Guardar",
            saving_generic: "Guardando...",
            sending_generic: "Enviando...",
            validation_name_required: "El nombre es obligatorio",
            validation_one_question: "Añade al menos 1 pregunta",
            validation_target_channel: "Selecciona un canal de destino para publicar el panel",
            modal_new_category: "🏷️ Nueva Categoria",
            modal_new_form: "📋 Nuevo Formulario",
            label_name: "Nombre",
            label_emoji: "Emoji",
            label_title: "Titulo",
            label_description: "Descripcion",
            label_color: "Color (hex)",
            label_image_url: "URL de Imagen (Imgur, etc.)",
            label_thumbnail_url: "URL del Thumbnail",
            label_footer: "Footer",
            label_greeting: "Mensaje de Bienvenida",
            placeholder_ticket_title: "🎫 Sistema de Tickets",
            placeholder_ticket_desc: "Selecciona una categoria para abrir un ticket.",
            placeholder_greeting: "Hola {user}! Gracias por abrir un ticket.",
            preview_default_title: "🎫 Sistema de Tickets",
            preview_default_desc: "Selecciona una categoria...",
            preview_default_footer: "Sistema de soporte",
            preview_select_placeholder: "📂 Selecciona una categoria...",
            placeholder_category_name: "Ej: Soporte General",
            placeholder_category_desc: "Ayuda con juegos",
            placeholder_question_1: "Pregunta 1 (Ej: Edad?)",
            placeholder_question_2: "Pregunta 2 (Opcional)",
            placeholder_question_3: "Pregunta 3 (Opcional)",
            placeholder_question_4: "Pregunta 4 (Opcional)",
            placeholder_question_5: "Pregunta 5 (Opcional)"
        },
        en: {
            landing_page_title: "Tenancy - The Ultimate Support System",
            nav_contact: "Contact",
            nav_docs: "Docs",
            nav_invite: "Invite Bot",
            nav_panel: "Web Panel",
            nav_logout: "Logout",
            landing_hero_title: "Tenancy Bot",
            hero_desc: "Your ultimate ticket management solution. Tenancy streamlines support for your server with an intuitive web panel, advanced customization, and frequent updates that improve your community experience.",
            btn_access_panel: "Open Panel",
            btn_invite_bot: "Invite Bot",
            landing_docs_title: "Quick Documentation",
            landing_docs_subtitle: "Learn how to set up Tenancy in 3 steps.",
            landing_step1_title: "Invite the bot",
            landing_step1_desc: "Add the bot to your server and grant Administrator permissions so it can create ticket channels freely.",
            landing_step2_title: "Roles and Channels",
            landing_step2_desc: "Open the web panel and go to Settings. Assign which roles can manage tickets and where logs will be created.",
            landing_step3_title: "Send the Panel",
            landing_step3_desc: "Create your categories and send the embed to your support channel from the web panel. Your users can start opening tickets right away.",
            landing_footer: "Tenancy Bot © 2026. All rights reserved.",
            dashboard_page_title: "Dashboard - Tenancy",
            dashboard_loading_servers: "Loading servers...",
            dashboard_loading_data: "Loading data...",
            sidebar_overview: "MONITOR_SYS",
            sidebar_tickets: "TICKETS_DB",
            sidebar_config: "SYS_CONFIG",
            sidebar_customize: "UI_OVERRIDE",
            sidebar_applications: "APPLIC_SYS",
            sidebar_dev: "DEV_TERMINAL",
            dashboard_server_selector_title: "Server Selector",
            dashboard_server_selector_subtitle: "Select a server to manage Tenancy or invite the bot to a new one.",
            dashboard_servers_with_bot: "Servers with Tenancy",
            dashboard_servers_without_bot: "Servers without Tenancy",
            dashboard_overview_title: "OVERVIEW",
            dashboard_stat_total: "Total Tickets",
            dashboard_stat_open: "Open Tickets",
            dashboard_stat_closed: "Closed Tickets",
            dashboard_stat_categories: "Categories",
            dashboard_recent_tickets: "RECENT TICKETS",
            dashboard_tickets_title: "TICKET MANAGEMENT",
            dashboard_config_title: "SYS_CONFIG",
            dashboard_config_subtitle: "LOCAL INSTANCE SETTINGS",
            dashboard_general_options: "🌐 General Options",
            dashboard_bot_language: "Bot Language",
            dashboard_bot_language_help: "Change the language used by commands, modals, and messages.",
            dashboard_staff_roles: "👥 Staff Roles",
            dashboard_support_roles: "Support Roles",
            dashboard_support_roles_help: "Can view and manage tickets",
            dashboard_add_support_role: "+ Add support role...",
            dashboard_admin_roles: "Admin Roles",
            dashboard_admin_roles_help: "Full access to tickets and configuration",
            dashboard_add_admin_role: "+ Add admin role...",
            dashboard_dashboard_roles: "Dashboard Access Roles",
            dashboard_dashboard_roles_help: "Can access this web panel and configure the bot",
            dashboard_add_dashboard_role: "+ Add dashboard role...",
            dashboard_add_role_generic: "+ Add role...",
            dashboard_channels: "📁 Channels",
            dashboard_ticket_category: "Discord Category for Tickets",
            dashboard_ticket_category_help: "Ticket channels will be created inside this category",
            dashboard_log_channel: "Log Channel",
            dashboard_log_channel_help: "Channel where closed ticket logs are sent",
            dashboard_panel_channel: "Panel Channel",
            dashboard_panel_channel_help: "Channel where the ticket panel will be sent or updated",
            dashboard_ticket_categories: "🏷️ Ticket Categories",
            dashboard_ticket_panel: "📋 Ticket Panel",
            dashboard_ticket_panel_help: "Send or update the ticket panel in the configured channel. The panel reflects the categories and the design from the Customization section.",
            dashboard_panel_status_inactive: "No panel sent",
            dashboard_panel_status_active: "Panel active in {channelName}",
            dashboard_panel_send_btn: "Send Panel",
            dashboard_panel_update_btn: "Update Panel",
            dashboard_customize_title: "UI_OVERRIDE",
            dashboard_customize_subtitle: "EMBED VISUAL SETTINGS",
            dashboard_embed_editor: "Embed Editor",
            dashboard_greeting_variables: "Variables: {user}, {subject}, {category}",
            dashboard_preview: "Preview",
            dashboard_applications_title: "APPLIC_SYS",
            dashboard_applications_subtitle: "STAFF APPLICATION FORMS",
            dashboard_app_channel_title: "📁 Applications Channel",
            dashboard_app_channel_label: "Channel to receive forms",
            dashboard_app_channel_help: "Private channel where admins will review and accept or deny applications",
            dashboard_send_app_panel_title: "📤 Send Applications Panel",
            dashboard_app_panel_channel_label: "Channel where the panel will be published",
            dashboard_app_panel_channel_help: "Public channel where users will click buttons to apply.",
            dashboard_created_forms: "📋 Created Forms",
            dashboard_app_name_label: "Role Name (Ex: Moderator)",
            dashboard_app_role_to_give: "Role to grant if accepted",
            dashboard_app_role_none: "None",
            dashboard_questions_max: "Questions (Max 5)",
            dashboard_server_selector_option: "🏠 Server Selector",
            dashboard_no_category_option: "No category",
            dashboard_no_log_channel_option: "No log channel",
            dashboard_select_channel_option: "Select a channel...",
            dashboard_servers_with_bot_empty: "You have no servers with Tenancy installed or you do not have administrator permissions.",
            dashboard_servers_without_bot_empty: "You have no pending servers.",
            dashboard_members_label: "members",
            dashboard_manage_btn: "Manage",
            dashboard_missing_install: "Tenancy is not installed yet",
            dashboard_invite_btn: "Invite",
            dashboard_no_tickets_yet: "No tickets yet",
            dashboard_no_banned_users: "No banned users",
            dashboard_no_open_tickets: "No open tickets",
            dashboard_no_closed_tickets: "No closed tickets",
            dashboard_no_categories: "No categories yet. Use the + button to add one.",
            dashboard_no_applications: "No forms created yet. Use the + button to add one.",
            dashboard_questions_label: "questions",
            dashboard_role_label: "Role",
            dashboard_panel_updated: "updated",
            dashboard_panel_sent: "sent",
            dashboard_app_panel_success: "Applications panel {action} successfully",
            dashboard_premium_notice: "🔒 Upgrade to Premium to customize colors, remove the watermark, and unlock unlimited categories. Pay with Binance Pay.",
            table_user: "User",
            table_category: "Category",
            table_subject: "Subject",
            table_status: "Status",
            table_date: "Date",
            table_claimed: "Claimed",
            tab_open: "🟢 Open",
            tab_closed: "🔴 Closed",
            tab_banned: "🚫 Banned",
            status_open: "Open",
            status_closed: "Closed",
            btn_save_general: "💾 Save General",
            btn_save_roles: "💾 Save Roles",
            btn_save_channels: "💾 Save Channels",
            btn_add: "+ Add",
            btn_save_changes: "💾 Save Changes",
            btn_save_channel: "💾 Save Channel",
            btn_new_form: "+ New Form",
            btn_cancel: "Cancel",
            btn_save: "Save",
            saving_generic: "Saving...",
            sending_generic: "Sending...",
            validation_name_required: "Name is required",
            validation_one_question: "Add at least 1 question",
            validation_target_channel: "Select a target channel to publish the panel",
            modal_new_category: "🏷️ New Category",
            modal_new_form: "📋 New Form",
            label_name: "Name",
            label_emoji: "Emoji",
            label_title: "Title",
            label_description: "Description",
            label_color: "Color (hex)",
            label_image_url: "Image URL (Imgur, etc.)",
            label_thumbnail_url: "Thumbnail URL",
            label_footer: "Footer",
            label_greeting: "Welcome Message",
            placeholder_ticket_title: "🎫 Ticket System",
            placeholder_ticket_desc: "Select a category to open a ticket.",
            placeholder_greeting: "Hello {user}! Thanks for opening a ticket.",
            preview_default_title: "🎫 Ticket System",
            preview_default_desc: "Select a category...",
            preview_default_footer: "Support system",
            preview_select_placeholder: "📂 Select a category...",
            placeholder_category_name: "Ex: General Support",
            placeholder_category_desc: "Help with games",
            placeholder_question_1: "Question 1 (Ex: Age?)",
            placeholder_question_2: "Question 2 (Optional)",
            placeholder_question_3: "Question 3 (Optional)",
            placeholder_question_4: "Question 4 (Optional)",
            placeholder_question_5: "Question 5 (Optional)"
        }
    };

    function normalizeLanguage(language) {
        return language === "en" ? "en" : "es";
    }

    function getLanguage() {
        return normalizeLanguage(localStorage.getItem(STORAGE_KEY) || document.documentElement.lang || "es");
    }

    function interpolate(text, variables = {}) {
        return Object.entries(variables).reduce((acc, [name, value]) => {
            return acc.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
        }, text);
    }

    function translate(key, variables = {}, fallback = "") {
        const language = getLanguage();
        const base = dictionaries[language]?.[key] ?? dictionaries.es[key] ?? fallback ?? key;
        return interpolate(base, variables);
    }

    function applyTranslations(root = document) {
        const language = getLanguage();
        document.documentElement.lang = language;

        root.querySelectorAll("[data-i18n]").forEach((element) => {
            const key = element.getAttribute("data-i18n");
            const fallback = element.dataset.i18nFallback || element.textContent.trim();
            element.textContent = translate(key, {}, fallback);
        });

        root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
            const key = element.getAttribute("data-i18n-placeholder");
            const fallback = element.getAttribute("placeholder") || "";
            element.setAttribute("placeholder", translate(key, {}, fallback));
        });

        const selector = document.getElementById("siteLanguageSelect");
        if (selector && selector.value !== language) {
            selector.value = language;
        }
    }

    function setLanguage(language) {
        const normalized = normalizeLanguage(language);
        localStorage.setItem(STORAGE_KEY, normalized);
        applyTranslations();
        document.dispatchEvent(new CustomEvent("tenancy:language-changed", {
            detail: { language: normalized }
        }));
    }

    function bindLanguageSelector() {
        const selector = document.getElementById("siteLanguageSelect");
        if (!selector) return;

        selector.value = getLanguage();
        selector.addEventListener("change", (event) => {
            setLanguage(event.target.value);
        });
    }

    window.TenancyWebI18n = {
        dictionaries,
        getLanguage,
        setLanguage,
        applyTranslations,
        t: translate
    };

    document.addEventListener("DOMContentLoaded", () => {
        bindLanguageSelector();
        applyTranslations();
    });
})();
