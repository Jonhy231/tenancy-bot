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
import { parseColor, isValidImageUrl } from "./embed.js";

// ═══════════════════════════════════════════
// /anuncio — Enviar un anuncio con formato rico
// ═══════════════════════════════════════════

export const data = new SlashCommandBuilder()
    .setName("anuncio")
    .setDescription("Publica un anuncio formateado con opciones de ping y botón")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption(opt =>
        opt.setName("canal")
            .setDescription("Canal donde se publica el anuncio")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true))
    .addStringOption(opt =>
        opt.setName("titulo")
            .setDescription("Título del anuncio")
            .setMaxLength(256)
            .setRequired(true))
    .addStringOption(opt =>
        opt.setName("contenido")
            .setDescription("Cuerpo del anuncio (soporta markdown de Discord)")
            .setMaxLength(4096)
            .setRequired(true))
    .addStringOption(opt =>
        opt.setName("color")
            .setDescription("Color: código HEX (#5865F2) o nombre (rojo, azul, verde...)"))
    .addStringOption(opt =>
        opt.setName("mencion")
            .setDescription("Mención a enviar junto al anuncio")
            .addChoices(
                { name: "Ninguna", value: "none" },
                { name: "@here", value: "here" },
                { name: "@everyone", value: "everyone" },
            ))
    .addStringOption(opt =>
        opt.setName("imagen")
            .setDescription("URL de imagen principal (HTTPS)"))
    .addStringOption(opt =>
        opt.setName("miniatura")
            .setDescription("URL del thumbnail (HTTPS)"))
    .addStringOption(opt =>
        opt.setName("boton")
            .setDescription("Botón de enlace: texto|url (ej: Más info|https://ejemplo.com)"));

export async function execute(interaction) {
    // ═══ Verificar permisos ═══
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: STRINGS.NO_PERMISSION, flags: MessageFlags.Ephemeral });
    }

    // ═══ Obtener opciones ═══
    const channel = interaction.options.getChannel("canal");
    const titulo = interaction.options.getString("titulo");
    const contenido = interaction.options.getString("contenido");
    const colorInput = interaction.options.getString("color");
    const mencion = interaction.options.getString("mencion") || "none";
    const imagen = interaction.options.getString("imagen");
    const miniatura = interaction.options.getString("miniatura");
    const botonInput = interaction.options.getString("boton");

    // ═══ Validaciones ═══
    if (!titulo || !contenido) {
        return interaction.reply({ content: STRINGS.ANNOUNCEMENT_EMPTY, flags: MessageFlags.Ephemeral });
    }

    // Permisos de mención
    if ((mencion === "everyone" || mencion === "here") &&
        !interaction.memberPermissions.has(PermissionFlagsBits.MentionEveryone)) {
        return interaction.reply({ content: STRINGS.NO_MENTION_PERMISSION, flags: MessageFlags.Ephemeral });
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

    // Botón
    let buttonRow = null;
    if (botonInput) {
        const parts = botonInput.split("|").map(s => s.trim());
        if (parts.length < 2 || !parts[0] || !parts[1]) {
            return interaction.reply({ content: STRINGS.BUTTON_INVALID, flags: MessageFlags.Ephemeral });
        }
        const [btnText, btnUrl] = parts;
        try {
            new URL(btnUrl); // Validar URL
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

    // Longitud total
    const totalLength = titulo.length + contenido.length;
    if (totalLength > 6000) {
        return interaction.reply({ content: STRINGS.EMBED_TOTAL_LONG, flags: MessageFlags.Ephemeral });
    }

    // ═══ Construir Embed ═══
    const avatarUrl = interaction.client.user?.displayAvatarURL({ size: 64 });
    const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(contenido)
        .setColor(color || parseInt(BRAND.colors.primary.replace("#", ""), 16))
        .setTimestamp()
        .setFooter({ text: `📢 Anuncio — ${BRAND.name}`, iconURL: avatarUrl || undefined });

    if (imagen) embed.setImage(imagen);
    if (miniatura) embed.setThumbnail(miniatura);

    // ═══ Texto de mención ═══
    let mentionText = "";
    if (mencion === "here") mentionText = "@here";
    else if (mencion === "everyone") mentionText = "@everyone";

    // ═══ Botones de confirmación ═══
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

    // ═══ Vista previa efímera ═══
    const previewComponents = [confirmRow];
    const preview = await interaction.reply({
        content: STRINGS.ANNOUNCEMENT_PREVIEW + (mentionText ? `\n\n**Mención:** ${mentionText}` : ""),
        embeds: [embed],
        components: previewComponents,
        flags: MessageFlags.Ephemeral,
    });

    // ═══ Collector de botones (60s timeout) ═══
    try {
        const btnInteraction = await preview.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id && i.customId.endsWith(uid),
            time: 60_000,
        });

        if (btnInteraction.customId === `anuncio_send_${uid}`) {
            // Preparar payload del mensaje final
            const messagePayload = {
                content: mentionText || undefined,
                embeds: [embed],
                components: buttonRow ? [buttonRow] : [],
            };

            await channel.send(messagePayload);

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
