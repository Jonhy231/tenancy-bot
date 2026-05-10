import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType,
} from "discord.js";
import { BRAND, COLOR_NAMES } from "../../config/branding.js";
import { STRINGS } from "../../config/strings.js";
import { getGuildConfig } from "../../database/cache.js";

// ═══════════════════════════════════════════
// /embed — Crear y enviar un embed personalizado
// Soporta: título, descripción, color, imagen,
//          miniatura, footer, author, URL de título,
//          y hasta 5 fields personalizados.
// ═══════════════════════════════════════════

export const data = new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Crea y envía un embed personalizado a un canal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

    // ── Canal destino ──────────────────────────────────────────────
    .addChannelOption(opt =>
        opt.setName("canal")
            .setDescription("Canal donde se enviará el embed")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true))

    // ── Contenido base ─────────────────────────────────────────────
    .addStringOption(opt =>
        opt.setName("titulo")
            .setDescription("Título del embed (máx 256 caracteres)")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("titulo_url")
            .setDescription("URL al hacer clic en el título (HTTPS)"))
    .addStringOption(opt =>
        opt.setName("descripcion")
            .setDescription("Descripción/cuerpo del embed (máx 4096 caracteres)")
            .setMaxLength(4096))

    // ── Apariencia ─────────────────────────────────────────────────
    .addStringOption(opt =>
        opt.setName("color")
            .setDescription("Color: código HEX (#5865F2) o nombre (rojo, azul, verde, morado...)"))
    .addStringOption(opt =>
        opt.setName("imagen")
            .setDescription("URL de la imagen principal (HTTPS)"))
    .addStringOption(opt =>
        opt.setName("miniatura")
            .setDescription("URL del thumbnail (HTTPS)"))

    // ── Author ─────────────────────────────────────────────────────
    .addStringOption(opt =>
        opt.setName("author_nombre")
            .setDescription("Texto del author (parte superior del embed, máx 256 caracteres)")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("author_icono")
            .setDescription("URL del icono del author (HTTPS)"))

    // ── Footer ─────────────────────────────────────────────────────
    .addStringOption(opt =>
        opt.setName("footer")
            .setDescription("Texto del footer"))

    // ── Fields (hasta 5) ──────────────────────────────────────────
    // Field 1
    .addStringOption(opt =>
        opt.setName("field1_nombre")
            .setDescription("Nombre del field 1 (máx 256 caracteres)")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("field1_valor")
            .setDescription("Valor del field 1 (máx 1024 caracteres)")
            .setMaxLength(1024))
    .addBooleanOption(opt =>
        opt.setName("field1_inline")
            .setDescription("¿Field 1 en línea? (default: false)"))

    // Field 2
    .addStringOption(opt =>
        opt.setName("field2_nombre")
            .setDescription("Nombre del field 2 (máx 256 caracteres)")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("field2_valor")
            .setDescription("Valor del field 2 (máx 1024 caracteres)")
            .setMaxLength(1024))
    .addBooleanOption(opt =>
        opt.setName("field2_inline")
            .setDescription("¿Field 2 en línea? (default: false)"))

    // Field 3
    .addStringOption(opt =>
        opt.setName("field3_nombre")
            .setDescription("Nombre del field 3 (máx 256 caracteres)")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("field3_valor")
            .setDescription("Valor del field 3 (máx 1024 caracteres)")
            .setMaxLength(1024))
    .addBooleanOption(opt =>
        opt.setName("field3_inline")
            .setDescription("¿Field 3 en línea? (default: false)"))

    // Field 4
    .addStringOption(opt =>
        opt.setName("field4_nombre")
            .setDescription("Nombre del field 4 (máx 256 caracteres)")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("field4_valor")
            .setDescription("Valor del field 4 (máx 1024 caracteres)")
            .setMaxLength(1024))
    .addBooleanOption(opt =>
        opt.setName("field4_inline")
            .setDescription("¿Field 4 en línea? (default: false)"))

    // Field 5
    .addStringOption(opt =>
        opt.setName("field5_nombre")
            .setDescription("Nombre del field 5 (máx 256 caracteres)")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("field5_valor")
            .setDescription("Valor del field 5 (máx 1024 caracteres)")
            .setMaxLength(1024))
    .addBooleanOption(opt =>
        opt.setName("field5_inline")
            .setDescription("¿Field 5 en línea? (default: false)"));

// ═══════════════════════════════════════════
// execute
// ═══════════════════════════════════════════
export async function execute(interaction) {

    // ── Permisos ───────────────────────────────────────────────────
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: STRINGS.NO_PERMISSION, flags: MessageFlags.Ephemeral });
    }

    // ── Premium check ──────────────────────────────────────────────
    const config = await getGuildConfig(interaction.guildId);
    if (!config.isPremium) {
        return interaction.reply({
            content: "🔒 **Comando Bloqueado**\nEl comando `/embed` es exclusivo de **Tenancy Premium**. Adquiere premium en el dashboard para crear embeds personalizados sin marca de agua.",
            flags: MessageFlags.Ephemeral,
        });
    }

    // ── Leer opciones ──────────────────────────────────────────────
    const channel      = interaction.options.getChannel("canal");
    const titulo       = interaction.options.getString("titulo");
    const tituloUrl    = interaction.options.getString("titulo_url");
    const descripcion  = interaction.options.getString("descripcion");
    const colorInput   = interaction.options.getString("color");
    const imagen       = interaction.options.getString("imagen");
    const miniatura    = interaction.options.getString("miniatura");
    const authorNombre = interaction.options.getString("author_nombre");
    const authorIcono  = interaction.options.getString("author_icono");
    const footerText   = interaction.options.getString("footer");

    // Recoger los 5 fields en un array, descartando los incompletos
    const fields = collectFields(interaction);

    // ── Validaciones ───────────────────────────────────────────────
    if (!titulo && !descripcion && fields.length === 0) {
        return interaction.reply({ content: STRINGS.EMBED_EMPTY, flags: MessageFlags.Ephemeral });
    }

    const color = parseColor(colorInput);
    if (colorInput && color === null) {
        return interaction.reply({ content: STRINGS.INVALID_COLOR, flags: MessageFlags.Ephemeral });
    }

    if (imagen && !isValidImageUrl(imagen)) {
        return interaction.reply({ content: STRINGS.INVALID_URL.replace("{url}", imagen), flags: MessageFlags.Ephemeral });
    }
    if (miniatura && !isValidImageUrl(miniatura)) {
        return interaction.reply({ content: STRINGS.INVALID_URL.replace("{url}", miniatura), flags: MessageFlags.Ephemeral });
    }
    if (authorIcono && !isValidImageUrl(authorIcono)) {
        return interaction.reply({ content: STRINGS.INVALID_URL.replace("{url}", authorIcono), flags: MessageFlags.Ephemeral });
    }
    if (tituloUrl && !isValidHttpsUrl(tituloUrl)) {
        return interaction.reply({ content: STRINGS.INVALID_URL.replace("{url}", tituloUrl), flags: MessageFlags.Ephemeral });
    }

    // Límite total de caracteres de Discord (6000)
    const totalLength =
        (titulo?.length       || 0) +
        (descripcion?.length  || 0) +
        (footerText?.length   || 0) +
        (authorNombre?.length || 0) +
        fields.reduce((acc, f) => acc + f.name.length + f.value.length, 0);

    if (totalLength > 6000) {
        return interaction.reply({ content: STRINGS.EMBED_TOTAL_LONG, flags: MessageFlags.Ephemeral });
    }

    // ── Construir embed ────────────────────────────────────────────
    const embed = buildEmbed({
        titulo, tituloUrl, descripcion, color, imagen, miniatura,
        authorNombre, authorIcono, footerText, fields, interaction,
    });

    // ── Botones de confirmación ────────────────────────────────────
    const uid = interaction.id;
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`embed_send_${uid}`)
            .setLabel(STRINGS.BTN_SEND)
            .setStyle(ButtonStyle.Success)
            .setEmoji("✅"),
        new ButtonBuilder()
            .setCustomId(`embed_cancel_${uid}`)
            .setLabel(STRINGS.BTN_CANCEL)
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🚫"),
    );

    // ── Vista previa efímera ───────────────────────────────────────
    const preview = await interaction.reply({
        content: STRINGS.EMBED_PREVIEW,
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral,
    });

    // ── Collector (60 s) ───────────────────────────────────────────
    try {
        const btnInteraction = await preview.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id && i.customId.endsWith(uid),
            time: 60_000,
        });

        if (btnInteraction.customId === `embed_send_${uid}`) {
            await channel.send({ embeds: [embed] });
            await btnInteraction.update({
                content: STRINGS.EMBED_SENT.replace("{channel}", `<#${channel.id}>`),
                embeds: [],
                components: [],
            });
        } else {
            await btnInteraction.update({
                content: STRINGS.EMBED_CANCELLED,
                embeds: [],
                components: [],
            });
        }
    } catch {
        await interaction.editReply({
            content: STRINGS.EMBED_TIMEOUT,
            embeds: [],
            components: [],
        }).catch(() => {});
    }
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

/**
 * Construye el EmbedBuilder con todos los parámetros nuevos.
 */
function buildEmbed({ titulo, tituloUrl, descripcion, color, imagen, miniatura, authorNombre, authorIcono, footerText, fields, interaction }) {
    const embed = new EmbedBuilder().setTimestamp();

    if (titulo)      embed.setTitle(titulo);
    if (tituloUrl)   embed.setURL(tituloUrl);          // ← URL en el título
    if (descripcion) embed.setDescription(descripcion);

    embed.setColor(color || parseInt(BRAND.colors.primary.replace("#", ""), 16));

    if (imagen)    embed.setImage(imagen);
    if (miniatura) embed.setThumbnail(miniatura);

    // Author
    if (authorNombre) {
        const authorIconUrl = (authorIcono && isValidImageUrl(authorIcono)) ? authorIcono : undefined;
        embed.setAuthor({ name: authorNombre, iconURL: authorIconUrl });
    }

    // Fields
    if (fields.length > 0) {
        embed.addFields(fields);
    }

    // Footer
    const footer   = footerText || BRAND.name;
    const avatarUrl = interaction.client.user?.displayAvatarURL({ size: 64 });
    embed.setFooter({ text: footer, iconURL: avatarUrl || undefined });

    return embed;
}

/**
 * Lee los 5 posibles fields del interaction y devuelve solo los válidos
 * (aquellos que tienen al menos nombre y valor).
 */
function collectFields(interaction) {
    const fields = [];

    for (let i = 1; i <= 5; i++) {
        const name   = interaction.options.getString(`field${i}_nombre`);
        const value  = interaction.options.getString(`field${i}_valor`);
        const inline = interaction.options.getBoolean(`field${i}_inline`) ?? false;

        // Solo añadir si ambos (nombre y valor) están presentes
        if (name && value) {
            fields.push({ name, value, inline });
        }
    }

    return fields;
}

/**
 * Convierte un string de color (nombre o HEX) a entero.
 * Devuelve null si el input es inválido.
 */
export function parseColor(input) {
    if (!input) return null;
    const cleaned = input.trim().toLowerCase();

    if (COLOR_NAMES[cleaned]) {
        return parseInt(COLOR_NAMES[cleaned].replace("#", ""), 16);
    }

    const hex = cleaned.startsWith("#") ? cleaned.slice(1) : cleaned;
    if (/^[0-9a-f]{6}$/i.test(hex)) {
        return parseInt(hex, 16);
    }

    return null;
}

/**
 * Valida que una URL sea HTTPS y apunte a una imagen reconocida.
 */
export function isValidImageUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") return false;
        const validExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
        const hasExt = validExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext));
        const isCDN  = parsed.hostname.includes("discord") ||
                       parsed.hostname.includes("imgur")   ||
                       parsed.hostname.includes("i.imgur");
        return hasExt || isCDN;
    } catch {
        return false;
    }
}

/**
 * Valida que una URL sea HTTPS (para el título URL, que no necesita ser imagen).
 */
export function isValidHttpsUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:";
    } catch {
        return false;
    }
}
