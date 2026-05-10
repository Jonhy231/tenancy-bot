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
// Modo 1 → pega un JSON de embed directamente
// Modo 2 → opciones individuales (título, descripción,
//           color, imagen, miniatura, footer, author,
//           URL de título y hasta 4 fields opcionales)
//
// NOTA: Discord limita los slash commands a 25 opciones.
// Este comando usa 23 (se eliminó field5 para no superar el límite).
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

    // ── Modo JSON (tiene prioridad sobre el resto) ─────────────────
    .addStringOption(opt =>
        opt.setName("json")
            .setDescription("Pega el JSON completo del embed (ignora el resto de opciones si se usa)"))

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

    // ── Fields opcionales (hasta 4) ────────────────────────────────
    // Discord limita los slash commands a 25 opciones en total.
    // Con 11 opciones base, solo caben 4 fields (4×3 = 12 → total 23).

    // Field 1
    .addStringOption(opt =>
        opt.setName("field1_nombre")
            .setDescription("Nombre del field 1")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("field1_valor")
            .setDescription("Valor del field 1")
            .setMaxLength(1024))
    .addBooleanOption(opt =>
        opt.setName("field1_inline")
            .setDescription("¿Field 1 en línea?"))

    // Field 2
    .addStringOption(opt =>
        opt.setName("field2_nombre")
            .setDescription("Nombre del field 2")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("field2_valor")
            .setDescription("Valor del field 2")
            .setMaxLength(1024))
    .addBooleanOption(opt =>
        opt.setName("field2_inline")
            .setDescription("¿Field 2 en línea?"))

    // Field 3
    .addStringOption(opt =>
        opt.setName("field3_nombre")
            .setDescription("Nombre del field 3")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("field3_valor")
            .setDescription("Valor del field 3")
            .setMaxLength(1024))
    .addBooleanOption(opt =>
        opt.setName("field3_inline")
            .setDescription("¿Field 3 en línea?"))

    // Field 4
    .addStringOption(opt =>
        opt.setName("field4_nombre")
            .setDescription("Nombre del field 4")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("field4_valor")
            .setDescription("Valor del field 4")
            .setMaxLength(1024))
    .addBooleanOption(opt =>
        opt.setName("field4_inline")
            .setDescription("¿Field 4 en línea?"));

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

    const channel   = interaction.options.getChannel("canal");
    const jsonInput = interaction.options.getString("json");

    // ════════════════════════════════════════
    // MODO JSON
    // ════════════════════════════════════════
    if (jsonInput) {
        let embed;
        try {
            embed = buildEmbedFromJson(jsonInput);
        } catch (err) {
            return interaction.reply({
                content: `❌ **JSON inválido**\n\`\`\`${err.message}\`\`\`\nAsegúrate de que el JSON tenga el formato correcto de un embed de Discord.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        return sendWithConfirmation({ interaction, channel, embed });
    }

    // ════════════════════════════════════════
    // MODO OPCIONES INDIVIDUALES
    // ════════════════════════════════════════
    const titulo       = interaction.options.getString("titulo");
    const tituloUrl    = interaction.options.getString("titulo_url");
    const descripcion  = interaction.options.getString("descripcion");
    const colorInput   = interaction.options.getString("color");
    const imagen       = interaction.options.getString("imagen");
    const miniatura    = interaction.options.getString("miniatura");
    const authorNombre = interaction.options.getString("author_nombre");
    const authorIcono  = interaction.options.getString("author_icono");
    const footerText   = interaction.options.getString("footer");
    const fields       = collectFields(interaction);

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

    const totalLength =
        (titulo?.length       || 0) +
        (descripcion?.length  || 0) +
        (footerText?.length   || 0) +
        (authorNombre?.length || 0) +
        fields.reduce((acc, f) => acc + f.name.length + f.value.length, 0);

    if (totalLength > 6000) {
        return interaction.reply({ content: STRINGS.EMBED_TOTAL_LONG, flags: MessageFlags.Ephemeral });
    }

    const embed = buildEmbed({
        titulo, tituloUrl, descripcion, color, imagen, miniatura,
        authorNombre, authorIcono, footerText, fields, interaction,
    });

    return sendWithConfirmation({ interaction, channel, embed });
}

// ═══════════════════════════════════════════
// Confirmación + envío (compartido por ambos modos)
// ═══════════════════════════════════════════
async function sendWithConfirmation({ interaction, channel, embed }) {
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

    const preview = await interaction.reply({
        content: STRINGS.EMBED_PREVIEW,
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral,
    });

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
 * Construye un EmbedBuilder desde un JSON string de embed de Discord.
 * Soporta el formato estándar (title, description, color, fields,
 * author, footer, image, thumbnail, url).
 * Lanza un Error descriptivo si el JSON es inválido o vacío.
 */
function buildEmbedFromJson(jsonString) {
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch {
        throw new Error("No se pudo parsear el JSON. Verifica comas, comillas y llaves.");
    }

    if (typeof data !== "object" || Array.isArray(data)) {
        throw new Error("El JSON debe ser un objeto `{}`, no un array ni otro tipo.");
    }

    const hasContent =
        data.title       ||
        data.description ||
        (Array.isArray(data.fields) && data.fields.length > 0);

    if (!hasContent) {
        throw new Error("El embed necesita al menos `title`, `description` o `fields`.");
    }

    if (data.fields) {
        if (!Array.isArray(data.fields)) {
            throw new Error("`fields` debe ser un array.");
        }
        for (const [i, f] of data.fields.entries()) {
            if (!f.name || !f.value) {
                throw new Error(`Field en posición ${i} le falta \`name\` o \`value\`.`);
            }
            if (f.name.length > 256)  throw new Error(`Field ${i}: \`name\` supera 256 caracteres.`);
            if (f.value.length > 1024) throw new Error(`Field ${i}: \`value\` supera 1024 caracteres.`);
        }
        if (data.fields.length > 25) {
            throw new Error("Un embed puede tener máximo 25 fields.");
        }
    }

    const embed = new EmbedBuilder();

    if (data.title)       embed.setTitle(data.title);
    if (data.url)         embed.setURL(data.url);
    if (data.description) embed.setDescription(data.description);

    if (data.color !== undefined) {
        const color = typeof data.color === "number"
            ? data.color
            : parseColor(String(data.color));
        if (color !== null) embed.setColor(color);
    }

    if (data.author) {
        embed.setAuthor({
            name:    data.author.name                          || "Author",
            iconURL: data.author.icon_url || data.author.iconURL || undefined,
            url:     data.author.url                          || undefined,
        });
    }

    if (data.thumbnail?.url) embed.setThumbnail(data.thumbnail.url);
    if (data.image?.url)     embed.setImage(data.image.url);

    if (data.fields?.length) {
        embed.addFields(data.fields.map(f => ({
            name:   f.name,
            value:  f.value,
            inline: f.inline ?? false,
        })));
    }

    if (data.footer) {
        embed.setFooter({
            text:    data.footer.text                            || "",
            iconURL: data.footer.icon_url || data.footer.iconURL || undefined,
        });
    }

    embed.setTimestamp();
    return embed;
}

/**
 * Construye el EmbedBuilder desde opciones individuales del slash command.
 */
function buildEmbed({ titulo, tituloUrl, descripcion, color, imagen, miniatura, authorNombre, authorIcono, footerText, fields, interaction }) {
    const embed = new EmbedBuilder().setTimestamp();

    if (titulo)      embed.setTitle(titulo);
    if (tituloUrl)   embed.setURL(tituloUrl);
    if (descripcion) embed.setDescription(descripcion);

    embed.setColor(color || parseInt(BRAND.colors.primary.replace("#", ""), 16));

    if (imagen)    embed.setImage(imagen);
    if (miniatura) embed.setThumbnail(miniatura);

    if (authorNombre) {
        const authorIconUrl = (authorIcono && isValidImageUrl(authorIcono)) ? authorIcono : undefined;
        embed.setAuthor({ name: authorNombre, iconURL: authorIconUrl });
    }

    if (fields.length > 0) embed.addFields(fields);

    const footer    = footerText || BRAND.name;
    const avatarUrl = interaction.client.user?.displayAvatarURL({ size: 64 });
    embed.setFooter({ text: footer, iconURL: avatarUrl || undefined });

    return embed;
}

/**
 * Lee los 4 posibles fields del interaction.
 * Solo incluye un field si tiene nombre Y valor (ambos son opcionales).
 */
function collectFields(interaction) {
    const fields = [];
    for (let i = 1; i <= 4; i++) {
        const name   = interaction.options.getString(`field${i}_nombre`);
        const value  = interaction.options.getString(`field${i}_valor`);
        const inline = interaction.options.getBoolean(`field${i}_inline`) ?? false;
        if (name && value) fields.push({ name, value, inline });
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
    if (COLOR_NAMES[cleaned]) return parseInt(COLOR_NAMES[cleaned].replace("#", ""), 16);
    const hex = cleaned.startsWith("#") ? cleaned.slice(1) : cleaned;
    if (/^[0-9a-f]{6}$/i.test(hex)) return parseInt(hex, 16);
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
        return new URL(url).protocol === "https:";
    } catch {
        return false;
    }
}
