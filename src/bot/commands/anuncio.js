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
import { BRAND } from "../../config/branding.js";
import { STRINGS } from "../../config/strings.js";
import { parseColor, isValidImageUrl, isValidHttpsUrl } from "./embed.js";
import { getGuildConfig } from "../../database/cache.js";

// ═══════════════════════════════════════════
// /anuncio — Enviar un anuncio con formato rico
// Modo 1 → pega un JSON de embed directamente
// Modo 2 → opciones individuales (título, contenido,
//           color, imagen, miniatura, mención, botón,
//           author, URL de título y hasta 4 fields)
//
// NOTA: Discord limita los slash commands a 25 opciones.
// Este comando usa 24 (se eliminó field5 para no superar el límite).
// ═══════════════════════════════════════════

export const data = new SlashCommandBuilder()
    .setName("anuncio")
    .setDescription("Publica un anuncio formateado con opciones de ping y botón")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

    // ── Canal destino ──────────────────────────────────────────────
    .addChannelOption(opt =>
        opt.setName("canal")
            .setDescription("Canal donde se publica el anuncio")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true))

    // ── Modo JSON (tiene prioridad sobre el resto) ─────────────────
    .addStringOption(opt =>
        opt.setName("json")
            .setDescription("Pega el JSON completo del embed (ignora las otras opciones de contenido si se usa)"))

    // ── Contenido base ─────────────────────────────────────────────
    .addStringOption(opt =>
        opt.setName("titulo")
            .setDescription("Título del anuncio")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("titulo_url")
            .setDescription("URL al hacer clic en el título (HTTPS)"))
    .addStringOption(opt =>
        opt.setName("contenido")
            .setDescription("Cuerpo del anuncio (soporta markdown de Discord)")
            .setMaxLength(4096))

    // ── Apariencia ─────────────────────────────────────────────────
    .addStringOption(opt =>
        opt.setName("color")
            .setDescription("Color: código HEX (#5865F2) o nombre (rojo, azul, verde...)"))
    .addStringOption(opt =>
        opt.setName("imagen")
            .setDescription("URL de imagen principal (HTTPS)"))
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

    // ── Mención y botón ────────────────────────────────────────────
    .addStringOption(opt =>
        opt.setName("mencion")
            .setDescription("Mención a enviar junto al anuncio")
            .addChoices(
                { name: "Ninguna",   value: "none"     },
                { name: "@here",     value: "here"     },
                { name: "@everyone", value: "everyone" },
            ))
    .addStringOption(opt =>
        opt.setName("boton")
            .setDescription("Botón de enlace: texto|url (ej: Más info|https://ejemplo.com)"))

    // ── Fields opcionales (hasta 4) ────────────────────────────────
    // Discord limita los slash commands a 25 opciones en total.
    // Con 12 opciones base, solo caben 4 fields (4×3 = 12 → total 24).

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
            content: "🔒 **Comando Bloqueado**\nEl comando `/anuncio` es exclusivo de **Tenancy Premium**. Adquiere premium en el dashboard para desbloquear los anuncios globales y con pings.",
            flags: MessageFlags.Ephemeral,
        });
    }

    const channel   = interaction.options.getChannel("canal");
    const jsonInput = interaction.options.getString("json");
    const mencion   = interaction.options.getString("mencion") || "none";
    const botonInput = interaction.options.getString("boton");

    // Permisos de mención (se valida siempre, independiente del modo)
    if ((mencion === "everyone" || mencion === "here") &&
        !interaction.memberPermissions.has(PermissionFlagsBits.MentionEveryone)) {
        return interaction.reply({ content: STRINGS.NO_MENTION_PERMISSION, flags: MessageFlags.Ephemeral });
    }

    // Botón de enlace (se procesa siempre, independiente del modo)
    let buttonRow = null;
    if (botonInput) {
        const parts = botonInput.split("|").map(s => s.trim());
        if (parts.length < 2 || !parts[0] || !parts[1]) {
            return interaction.reply({ content: STRINGS.BUTTON_INVALID, flags: MessageFlags.Ephemeral });
        }
        const [btnText, btnUrl] = parts;
        try {
            new URL(btnUrl);
        } catch {
            return interaction.reply({ content: STRINGS.BUTTON_INVALID, flags: MessageFlags.Ephemeral });
        }
        buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(btnText.slice(0, 80))
                .setURL(btnUrl)
                .setStyle(ButtonStyle.Link)
                .setEmoji("🔗"),
        );
    }

    let mentionText = "";
    if (mencion === "here")          mentionText = "@here";
    else if (mencion === "everyone") mentionText = "@everyone";

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

        return sendWithConfirmation({ interaction, channel, embed, mentionText, buttonRow });
    }

    // ════════════════════════════════════════
    // MODO OPCIONES INDIVIDUALES
    // ════════════════════════════════════════
    const titulo       = interaction.options.getString("titulo");
    const tituloUrl    = interaction.options.getString("titulo_url");
    const contenido    = interaction.options.getString("contenido");
    const colorInput   = interaction.options.getString("color");
    const imagen       = interaction.options.getString("imagen");
    const miniatura    = interaction.options.getString("miniatura");
    const authorNombre = interaction.options.getString("author_nombre");
    const authorIcono  = interaction.options.getString("author_icono");
    const fields       = collectFields(interaction);

    if (!titulo && !contenido && fields.length === 0) {
        return interaction.reply({ content: STRINGS.ANNOUNCEMENT_EMPTY, flags: MessageFlags.Ephemeral });
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
        (contenido?.length    || 0) +
        (authorNombre?.length || 0) +
        fields.reduce((acc, f) => acc + f.name.length + f.value.length, 0);

    if (totalLength > 6000) {
        return interaction.reply({ content: STRINGS.EMBED_TOTAL_LONG, flags: MessageFlags.Ephemeral });
    }

    const avatarUrl = interaction.client.user?.displayAvatarURL({ size: 64 });
    const embed = new EmbedBuilder()
        .setColor(color || parseInt(BRAND.colors.primary.replace("#", ""), 16))
        .setTimestamp()
        .setFooter({ text: `📢 Anuncio — ${BRAND.name}`, iconURL: avatarUrl || undefined });

    if (titulo)    embed.setTitle(titulo);
    if (tituloUrl) embed.setURL(tituloUrl);
    if (contenido) embed.setDescription(contenido);
    if (imagen)    embed.setImage(imagen);
    if (miniatura) embed.setThumbnail(miniatura);

    if (authorNombre) {
        const authorIconUrl = (authorIcono && isValidImageUrl(authorIcono)) ? authorIcono : undefined;
        embed.setAuthor({ name: authorNombre, iconURL: authorIconUrl });
    }

    if (fields.length > 0) embed.addFields(fields);

    return sendWithConfirmation({ interaction, channel, embed, mentionText, buttonRow });
}

// ═══════════════════════════════════════════
// Confirmación + envío (compartido por ambos modos)
// ═══════════════════════════════════════════
async function sendWithConfirmation({ interaction, channel, embed, mentionText, buttonRow }) {
    const uid = interaction.id;
    const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`anuncio_send_${uid}`)
            .setLabel(STRINGS.BTN_SEND)
            .setStyle(ButtonStyle.Success)
            .setEmoji("📢"),
        new ButtonBuilder()
            .setCustomId(`anuncio_cancel_${uid}`)
            .setLabel(STRINGS.BTN_CANCEL)
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🚫"),
    );

    const preview = await interaction.reply({
        content: STRINGS.ANNOUNCEMENT_PREVIEW + (mentionText ? `\n\n**Mención:** ${mentionText}` : ""),
        embeds: [embed],
        components: [confirmRow],
        flags: MessageFlags.Ephemeral,
    });

    try {
        const btnInteraction = await preview.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id && i.customId.endsWith(uid),
            time: 60_000,
        });

        if (btnInteraction.customId === `anuncio_send_${uid}`) {
            await channel.send({
                content: mentionText || undefined,
                embeds: [embed],
                components: buttonRow ? [buttonRow] : [],
            });
            await btnInteraction.update({
                content: STRINGS.ANNOUNCEMENT_SENT.replace("{channel}", `<#${channel.id}>`),
                embeds: [],
                components: [],
            });
        } else {
            await btnInteraction.update({
                content: STRINGS.ANNOUNCEMENT_CANCELLED,
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
 * Mismo formato que embed.js — reutilizable desde cualquier herramienta
 * externa como discohook.org o embedbuilder.net.
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
        if (!Array.isArray(data.fields)) throw new Error("`fields` debe ser un array.");
        for (const [i, f] of data.fields.entries()) {
            if (!f.name || !f.value) throw new Error(`Field en posición ${i} le falta \`name\` o \`value\`.`);
            if (f.name.length > 256)   throw new Error(`Field ${i}: \`name\` supera 256 caracteres.`);
            if (f.value.length > 1024) throw new Error(`Field ${i}: \`value\` supera 1024 caracteres.`);
        }
        if (data.fields.length > 25) throw new Error("Un embed puede tener máximo 25 fields.");
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
            name:    data.author.name                            || "Author",
            iconURL: data.author.icon_url || data.author.iconURL || undefined,
            url:     data.author.url                            || undefined,
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
            text:    data.footer.text                              || "",
            iconURL: data.footer.icon_url || data.footer.iconURL  || undefined,
        });
    }

    embed.setTimestamp();
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
