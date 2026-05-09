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

// ═══════════════════════════════════════════
// /embed — Crear y enviar un embed personalizado
// ═══════════════════════════════════════════

export const data = new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Crea y envía un embed personalizado a un canal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption(opt =>
        opt.setName("canal")
            .setDescription("Canal donde se enviará el embed")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true))
    .addStringOption(opt =>
        opt.setName("titulo")
            .setDescription("Título del embed (máx 256 caracteres)")
            .setMaxLength(256))
    .addStringOption(opt =>
        opt.setName("descripcion")
            .setDescription("Descripción/cuerpo del embed (máx 4096 caracteres)")
            .setMaxLength(4096))
    .addStringOption(opt =>
        opt.setName("color")
            .setDescription("Color: código HEX (#5865F2) o nombre (rojo, azul, verde, morado...)"))
    .addStringOption(opt =>
        opt.setName("imagen")
            .setDescription("URL de la imagen principal (HTTPS)"))
    .addStringOption(opt =>
        opt.setName("miniatura")
            .setDescription("URL del thumbnail (HTTPS)"))
    .addStringOption(opt =>
        opt.setName("footer")
            .setDescription("Texto del footer"));

export async function execute(interaction) {
    // ═══ Verificar permisos ═══
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: STRINGS.NO_PERMISSION, flags: MessageFlags.Ephemeral });
    }

    // ═══ Obtener opciones ═══
    const channel = interaction.options.getChannel("canal");
    const titulo = interaction.options.getString("titulo");
    const descripcion = interaction.options.getString("descripcion");
    const colorInput = interaction.options.getString("color");
    const imagen = interaction.options.getString("imagen");
    const miniatura = interaction.options.getString("miniatura");
    const footerText = interaction.options.getString("footer");

    // ═══ Validaciones ═══
    if (!titulo && !descripcion) {
        return interaction.reply({ content: STRINGS.EMBED_EMPTY, flags: MessageFlags.Ephemeral });
    }

    // Color
    const color = parseColor(colorInput);
    if (colorInput && color === null) {
        return interaction.reply({ content: STRINGS.INVALID_COLOR, flags: MessageFlags.Ephemeral });
    }

    // URLs
    if (imagen && !isValidImageUrl(imagen)) {
        return interaction.reply({ content: STRINGS.INVALID_URL.replace("{url}", imagen), flags: MessageFlags.Ephemeral });
    }
    if (miniatura && !isValidImageUrl(miniatura)) {
        return interaction.reply({ content: STRINGS.INVALID_URL.replace("{url}", miniatura), flags: MessageFlags.Ephemeral });
    }

    // Longitud total
    const totalLength = (titulo?.length || 0) + (descripcion?.length || 0) + (footerText?.length || 0);
    if (totalLength > 6000) {
        return interaction.reply({ content: STRINGS.EMBED_TOTAL_LONG, flags: MessageFlags.Ephemeral });
    }

    // ═══ Construir Embed ═══
    const embed = buildEmbed({ titulo, descripcion, color, imagen, miniatura, footerText, interaction });

    // ═══ Botones de confirmación ═══
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

    // ═══ Vista previa efímera ═══
    const preview = await interaction.reply({
        content: STRINGS.EMBED_PREVIEW,
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral,
    });

    // ═══ Collector de botones (30s timeout) ═══
    try {
        const btnInteraction = await preview.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id && i.customId.endsWith(uid),
            time: 60_000,
        });

        if (btnInteraction.customId === `embed_send_${uid}`) {
            // Enviar al canal
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
        // Timeout
        await interaction.editReply({
            content: STRINGS.EMBED_TIMEOUT,
            embeds: [],
            components: [],
        }).catch(() => {});
    }
}

// ═══ Helpers ═══

function buildEmbed({ titulo, descripcion, color, imagen, miniatura, footerText, interaction }) {
    const embed = new EmbedBuilder().setTimestamp();

    if (titulo) embed.setTitle(titulo);
    if (descripcion) embed.setDescription(descripcion);
    embed.setColor(color || parseInt(BRAND.colors.primary.replace("#", ""), 16));
    if (imagen) embed.setImage(imagen);
    if (miniatura) embed.setThumbnail(miniatura);

    const footer = footerText || BRAND.name;
    const avatarUrl = interaction.client.user?.displayAvatarURL({ size: 64 });
    embed.setFooter({ text: footer, iconURL: avatarUrl || undefined });

    return embed;
}

export function parseColor(input) {
    if (!input) return null;
    const cleaned = input.trim().toLowerCase();

    // Nombre de color
    if (COLOR_NAMES[cleaned]) {
        return parseInt(COLOR_NAMES[cleaned].replace("#", ""), 16);
    }

    // HEX
    const hex = cleaned.startsWith("#") ? cleaned.slice(1) : cleaned;
    if (/^[0-9a-f]{6}$/i.test(hex)) {
        return parseInt(hex, 16);
    }

    return null;
}

export function isValidImageUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") return false;
        // Extensiones comunes de imagen O URLs de Discord/Imgur CDN
        const validExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
        const hasExt = validExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext));
        const isCDN = parsed.hostname.includes("discord") || parsed.hostname.includes("imgur") || parsed.hostname.includes("i.imgur");
        return hasExt || isCDN;
    } catch {
        return false;
    }
}
