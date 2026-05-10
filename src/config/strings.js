/**
 * ═══════════════════════════════════════════
 * TENANCY — Strings de respuesta (i18n: es)
 * Centraliza todos los mensajes de usuario
 * para facilitar traducciones futuras.
 * ═══════════════════════════════════════════
 */

export const STRINGS = {
    // ═══ Errores de permisos ═══
    NO_PERMISSION: "❌ No tienes permisos para usar este comando. Se requiere **Gestionar Mensajes** o **Administrador**.",
    NO_MENTION_PERMISSION: "❌ No tienes permisos para mencionar `@everyone` o `@here`. Se requiere **Mencionar a Todos**.",

    // ═══ Validaciones ═══
    EMBED_EMPTY: "❌ Debes incluir al menos un **título** o una **descripción** para crear el embed.",
    EMBED_TITLE_LONG: "❌ El título no puede exceder **256 caracteres**.",
    EMBED_DESC_LONG: "❌ La descripción no puede exceder **4096 caracteres**.",
    EMBED_TOTAL_LONG: "❌ El contenido total del embed excede el límite de Discord (**6000 caracteres**).",
    EMBED_FIELDS_MAX: "❌ No puedes añadir más de **25 campos** al embed.",
    INVALID_COLOR: "❌ Color no válido. Usa un código HEX (ej: `#5865F2`) o un nombre: `rojo`, `azul`, `verde`, `morado`, `amarillo`, `naranja`, `rosa`, `blanco`, `negro`.",
    INVALID_URL: "❌ La URL `{url}` no es válida. Debe ser una URL HTTPS que apunte a una imagen.",
    ANNOUNCEMENT_EMPTY: "❌ Debes incluir un **título** y **contenido** para el anuncio.",
    BUTTON_INVALID: "❌ Botón inválido. Usa el formato **texto|url**. Ejemplo: `Más info|https://ejemplo.com`",
    FIELD_INVALID: "❌ Campo inválido. Usa el formato **nombre|valor|inline**. El tercer valor es opcional y acepta `si` o `no`. Ejemplo: `Titulo|Texto del campo|si`",
    EMBED_SEND_ERROR: "❌ No se pudo enviar el embed al canal seleccionado. Verifica permisos del bot y del canal.",
    ANNOUNCEMENT_SEND_ERROR: "❌ No se pudo publicar el anuncio en el canal seleccionado. Verifica permisos del bot y del canal.",

    // ═══ Confirmación ═══
    EMBED_PREVIEW: "📋 **Vista previa del embed.** ¿Deseas enviarlo?",
    EMBED_SENT: "✅ Embed enviado correctamente en {channel}.",
    EMBED_CANCELLED: "🚫 Embed cancelado.",
    EMBED_TIMEOUT: "⏰ Tiempo agotado. El embed no fue enviado.",
    ANNOUNCEMENT_PREVIEW: "📢 **Vista previa del anuncio.** ¿Deseas publicarlo?",
    ANNOUNCEMENT_SENT: "✅ Anuncio publicado correctamente en {channel}.",
    ANNOUNCEMENT_CANCELLED: "🚫 Anuncio cancelado.",

    // ═══ Campos del modal ═══
    FIELD_MODAL_TITLE: "Añadir Campo al Embed",
    FIELD_NAME_LABEL: "Nombre del campo",
    FIELD_VALUE_LABEL: "Valor del campo",
    FIELD_INLINE_LABEL: "¿En línea? (si / no)",
    FIELD_ADDED: "✅ Campo añadido: **{name}**",

    // ═══ Botones ═══
    BTN_SEND: "Enviar",
    BTN_CANCEL: "Cancelar",
    BTN_ADD_FIELD: "Añadir Campo",
};
