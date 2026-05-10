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
// Soporta: título, contenido, color, imagen,
//          miniatura, mención, botón de enlace,
//          author, URL de título y hasta 5 fields.
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

    // ── Contenido base ─────────────────────────────────────────────
    .addStringOption(opt =>
        opt.setName("titulo")
            .setDescription("Título del anuncio")
            .setMaxLength(256)
            .setRequired(true))
    .addStringOption(opt =>
        opt.setName("titulo_url")
            .setDescription("URL al hacer clic en el título (HTTPS)"))
    .addStringOption(opt =>
        opt.setName("contenido")
            .setDescription("Cuerpo del anuncio (soporta markdown de Discord)")
            .setMaxLength(4096)
            .setRequired(true))

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
            content: "🔒 **Comando Bloqueado**\nEl comando `/anuncio` es exclusivo de **Tenancy Premium**. Adquiere premium en el dashboard para desbloquear los anuncios globales y con pings.",
            flags: MessageFlags.Ephemeral,
        });
    }

    // ── Leer opciones ──────────────────────────────────────────────
    const channel      = interaction.options.getChannel("canal");
    const titulo       = interaction.options.getString("titulo");
    const tituloUrl    = interaction.options.getString("titulo_url");
    const contenido    = interaction.options.getString("contenido");
    const colorInput   = interaction.options.getString("color");
    const imagen       = interaction.options.getString("imagen");
    const miniatura    = interaction.options.getString("miniatura");
    const authorNombre = interaction.options.getString("author_nombre");
    const authorIcono  = interaction.options.getString("author_icono");
    const mencion      = interaction.options.getString("mencion") || "none";
    const botonInput   = interaction.options.getString("boton");

    const fields = collectFields(interaction);

    // ── Validaciones ───────────────────────────────────────────────

    // Permisos de mención
    if ((mencion === "everyone" || mencion === "here") &&
        !interaction.memberPermissions.has(PermissionFlagsBits.MentionEveryone)) {
        return interaction.reply({ content: STRINGS.NO_MENTION_PERMISSION, flags: MessageFlags.Ephemeral });
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

    // Botón de enlace
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

    // Límite total de caracteres
    const totalLength =
        (titulo?.length       || 0) +
        (contenido?.length    || 0) +
        (authorNombre?.length || 0) +
        fields.reduce((acc, f) => acc + f.name.length + f.value.length, 0);

    if (totalLength > 6000) {
        return interaction.reply({ content: STRINGS.EMBED_TOTAL_LONG, flags: MessageFlags.Ephemeral });
    }

    // ── Construir embed ────────────────────────────────────────────
    const avatarUrl = interaction.client.user?.displayAvatarURL({ size: 64 });
    const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(contenido)
        .setColor(color || parseInt(BRAND.colors.primary.replace("#", ""), 16))
        .setTimestamp()
        .setFooter({ text: `📢 Anuncio — ${BRAND.name}`, iconURL: avatarUrl || undefined });

    if (tituloUrl)   embed.setURL(tituloUrl);
    if (imagen)      embed.setImage(imagen);
    if (miniatura)   embed.setThumbnail(miniatura);

    if (authorNombre) {
        const authorIconUrl = (authorIcono && isValidImageUrl(authorIcono)) ? authorIcono : undefined;
        embed.setAuthor({ name: authorNombre, iconURL: authorIconUrl });
    }

    if (fields.length > 0) {
        embed.addFields(fields);
    }

    // ── Texto de mención ───────────────────────────────────────────
    let mentionText = "";
    if (mencion === "here")     mentionText = "@here";
    else if (mencion === "everyone") mentionText = "@everyone";

    // ── Botones de confirmación ────────────────────────────────────
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

    // ── Vista previa efímera ───────────────────────────────────────
    const preview = await interaction.reply({
        content: STRINGS.ANNOUNCEMENT_PREVIEW + (mentionText ? `\n\n**Mención:** ${mentionText}` : ""),
        embeds: [embed],
        components: [confirmRow],
        flags: MessageFlags.Ephemeral,
    });

    // ── Collector (60 s) ───────────────────────────────────────────
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
 * Lee los 5 posibles fields del interaction y devuelve solo los válidos
 * (aquellos que tienen al menos nombre y valor).
 */
function collectFields(interaction) {
    const fields = [];

    for (let i = 1; i <= 5; i++) {
        const name   = interaction.options.getString(`field${i}_nombre`);
        const value  = interaction.options.getString(`field${i}_valor`);
        const inline = interaction.options.getBoolean(`field${i}_inline`) ?? false;

        if (name && value) {
            fields.push({ name, value, inline });
        }
    }

    return fields;
}
