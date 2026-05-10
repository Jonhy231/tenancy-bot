import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    PermissionFlagsBits,
    MessageFlags,
} from "discord.js";
import { getGuildConfig, updateGuildConfig } from "../../database/cache.js";
import Ticket from "../../database/models/Ticket.js";
import discordTranscripts from "discord-html-transcripts";
import { t } from "../utils/i18n.js";

// ══════════════════════════════════════════════════════
// 1. HANDLER: Select Menu → Muestra Modal
// ══════════════════════════════════════════════════════

export async function handleTicketSelect(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const categoryId = interaction.values[0];
    const lang = guildConfig.language || "es";

    if (guildConfig.bannedUsers.includes(interaction.user.id)) {
        return interaction.reply({
            content: t(lang, "TICKET_BANNED"),
            flags: [MessageFlags.Ephemeral],
        });
    }

    if (!guildConfig.isPremium && guildConfig.totalTicketsCreated >= 50) {
        return interaction.reply({
            content: t(lang, "TICKET_LIMIT_REACHED"),
            flags: [MessageFlags.Ephemeral],
        });
    }

    const existingTicket = await Ticket.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        status: "open",
    });

    if (existingTicket) {
        return interaction.reply({
            content: t(lang, "TICKET_ALREADY_OPEN", { channel: `<#${existingTicket.channelId}>` }),
            flags: [MessageFlags.Ephemeral],
        });
    }

    const category = guildConfig.categories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : "General";

    const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${categoryId}`)
        .setTitle(t(lang, "TICKET_MODAL_TITLE", { category: categoryName }).substring(0, 45));

    const subjectInput = new TextInputBuilder()
        .setCustomId("ticket_subject")
        .setLabel(t(lang, "TICKET_MODAL_SUBJECT"))
        .setPlaceholder(t(lang, "TICKET_MODAL_SUBJECT_PLACEHOLDER"))
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(500)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(subjectInput));
    await interaction.showModal(modal);

    try {
        await interaction.message.edit({
            components: interaction.message.components,
        });
    } catch (_) { }
}


// ══════════════════════════════════════════════════════
// 1b. HANDLER: Botón de Categoría → Muestra Modal (NOMBRE CAMBIADO)
// ══════════════════════════════════════════════════════

export async function handleTicketCategoryButton(interaction) { // <--- CAMBIO AQUÍ
    const guildConfig = await getGuildConfig(interaction.guildId);
    const categoryId = interaction.customId.replace("ticket_cat_", "");
    const lang = guildConfig.language || "es";

    if (guildConfig.bannedUsers.includes(interaction.user.id)) {
        return interaction.reply({
            content: t(lang, "TICKET_BANNED"),
            flags: [MessageFlags.Ephemeral],
        });
    }

    if (!guildConfig.isPremium && guildConfig.totalTicketsCreated >= 50) {
        return interaction.reply({
            content: t(lang, "TICKET_LIMIT_REACHED"),
            flags: [MessageFlags.Ephemeral],
        });
    }

    const existingTicket = await Ticket.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        status: "open",
    });

    if (existingTicket) {
        return interaction.reply({
            content: t(lang, "TICKET_ALREADY_OPEN", { channel: `<#${existingTicket.channelId}>` }),
            flags: [MessageFlags.Ephemeral],
        });
    }

    const category = guildConfig.categories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : "General";

    const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${categoryId}`)
        .setTitle(t(lang, "TICKET_MODAL_TITLE", { category: categoryName }).substring(0, 45));

    const subjectInput = new TextInputBuilder()
        .setCustomId("ticket_subject")
        .setLabel(t(lang, "TICKET_MODAL_SUBJECT"))
        .setPlaceholder(t(lang, "TICKET_MODAL_SUBJECT_PLACEHOLDER"))
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(500)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(subjectInput));
    await interaction.showModal(modal);
}

// ══════════════════════════════════════════════════════
// 2. HANDLER: Modal Submit → Crea Canal de Ticket
// ══════════════════════════════════════════════════════

export async function handleTicketModal(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";
    const categoryId = interaction.customId.replace("ticket_modal_", "");
    const subject = interaction.fields.getTextInputValue("ticket_subject");

    const category = guildConfig.categories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : "General";
    const categoryEmoji = category ? category.emoji : "🎫";

    const newCount = (guildConfig.ticketCounter || 0) + 1;
    const newTotal = (guildConfig.totalTicketsCreated || 0) + 1;
    await updateGuildConfig(interaction.guildId, {
        ticketCounter: newCount,
        totalTicketsCreated: newTotal
    });

    const ticketName = `${categoryEmoji}┃ticket-${String(newCount).padStart(4, "0")}`;

    const permissionOverwrites = [
        {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
        },
        {
            id: interaction.user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory,
            ],
        },
        {
            id: interaction.client.user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
            ],
        },
    ];

    for (const roleId of guildConfig.supportRoles) {
        permissionOverwrites.push({
            id: roleId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
            ],
        });
    }

    for (const roleId of guildConfig.adminRoles) {
        permissionOverwrites.push({
            id: roleId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory,
            ],
        });
    }

    const channel = await interaction.guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: guildConfig.ticketCategoryId || null,
        permissionOverwrites,
    });

    await Ticket.create({
        ticketNumber: newCount,
        guildId: interaction.guildId,
        channelId: channel.id,
        userId: interaction.user.id,
        userName: interaction.user.username,
        categoryId,
        categoryName,
        subject,
    });

    const greeting = guildConfig.ticketGreeting
        .replace("{user}", `<@${interaction.user.id}>`)
        .replace("{subject}", subject)
        .replace("{category}", categoryName);

    const ticketEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle(t(lang, "TICKET_EMBED_TITLE", { emoji: categoryEmoji, number: String(newCount).padStart(4, "0") }))
        .setDescription(greeting)
        .addFields(
            { name: t(lang, "TICKET_EMBED_CATEGORY"), value: categoryName, inline: true },
            { name: t(lang, "TICKET_EMBED_STATUS"), value: t(lang, "TICKET_EMBED_STATUS_OPEN"), inline: true },
            { name: t(lang, "TICKET_EMBED_CLAIMED_BY"), value: t(lang, "TICKET_EMBED_NOBODY"), inline: true },
        )
        .setFooter({ text: `ID: ${channel.id}` })
        .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel(t(lang, "BTN_CLOSE"))
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId("ticket_claim")
            .setLabel(t(lang, "BTN_CLAIM"))
            .setEmoji("📌")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("ticket_add")
            .setLabel(t(lang, "BTN_ADD_USER"))
            .setEmoji("👤")
            .setStyle(ButtonStyle.Secondary),
    );

    await channel.send({
        content: `<@${interaction.user.id}> — ${guildConfig.supportRoles.map(r => `<@&${r}>`).join(" ")}`,
        embeds: [ticketEmbed],
        components: [buttons],
    });

    await interaction.editReply({
        content: t(lang, "TICKET_CREATED_MSG", { channel: `<#${channel.id}>` }),
    });
}

// ══════════════════════════════════════════════════════
// 3. HANDLER: Botones de Gestión (NOMBRE CAMBIADO)
// ══════════════════════════════════════════════════════

export async function handleTicketManageButton(interaction) { // <--- CAMBIO AQUÍ
    const action = interaction.customId;

    switch (action) {
        case "ticket_close":
            await closeTicket(interaction);
            break;
        case "ticket_claim":
            await claimTicket(interaction);
            break;
        case "ticket_add":
            await addUserToTicket(interaction);
            break;
    }
}

async function closeTicket(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";

    const ticket = await Ticket.findOne({
        channelId: interaction.channelId,
        status: "open",
    });

    if (!ticket) {
        return interaction.reply({
            content: t(lang, "TICKET_NOT_ACTIVE"),
            flags: [MessageFlags.Ephemeral],
        });
    }

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle(t(lang, "TICKET_CLOSED_TITLE"))
                .setDescription(t(lang, "TICKET_CLOSED_DESC", { user: `<@${interaction.user.id}>` }))
                .setTimestamp(),
        ],
    });

    await Ticket.updateOne(
        { channelId: interaction.channelId },
        {
            status: "closed",
            closedBy: interaction.user.id,
            closedAt: new Date(),
        }
    );

    const ticketLabel = `ticket-${String(ticket.ticketNumber).padStart(4, "0")}`;

    try {
        const transcript = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            returnType: "attachment",
            filename: `${ticketLabel}.html`,
            poweredBy: false,
            saveImages: false,
        });

        if (guildConfig.logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle(`🔒 Ticket #${String(ticket.ticketNumber).padStart(4, "0")} cerrado`)
                    .addFields(
                        { name: "Abierto por", value: `<@${ticket.userId}>`, inline: true },
                        { name: "Cerrado por", value: `<@${interaction.user.id}>`, inline: true },
                        { name: "Categoría", value: ticket.categoryName, inline: true },
                        { name: "Asunto", value: ticket.subject || "Sin asunto", inline: false },
                        { name: "Reclamado por", value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : "Nadie", inline: true },
                    )
                    .setFooter({ text: `Duración: ${getTicketDuration(ticket.createdAt)}` })
                    .setTimestamp();

                await logChannel.send({
                    embeds: [logEmbed],
                    files: [transcript],
                });
            }
        }

        try {
            const ticketUser = await interaction.client.users.fetch(ticket.userId);
            const dmEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(t(lang, "TRANSCRIPT_DM_TITLE", { number: String(ticket.ticketNumber).padStart(4, "0") }))
                .setDescription(t(lang, "TRANSCRIPT_DM_DESC", { guildName: interaction.guild.name }))
                .addFields(
                    { name: t(lang, "TRANSCRIPT_SUBJECT"), value: ticket.subject || t(lang, "TRANSCRIPT_NO_SUBJECT") },
                    { name: t(lang, "TRANSCRIPT_CLOSED_BY"), value: `<@${interaction.user.id}>` },
                )
                .setTimestamp();

            // RATING BUTTONS
            const rateEmbed = new EmbedBuilder()
                .setColor(0xF1C40F)
                .setTitle(t(lang, "RATE_DM_TITLE"))
                .setDescription(t(lang, "RATE_DM_DESC", { guildName: interaction.guild.name }));

            const rateRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`ticket_rate_1_${ticket.channelId}`).setLabel("1").setEmoji("⭐").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`ticket_rate_2_${ticket.channelId}`).setLabel("2").setEmoji("⭐").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`ticket_rate_3_${ticket.channelId}`).setLabel("3").setEmoji("⭐").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`ticket_rate_4_${ticket.channelId}`).setLabel("4").setEmoji("⭐").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`ticket_rate_5_${ticket.channelId}`).setLabel("5").setEmoji("⭐").setStyle(ButtonStyle.Secondary),
            );

            await ticketUser.send({ embeds: [dmEmbed, rateEmbed], components: [rateRow], files: [transcript] });
        } catch (_) { }

    } catch (err) {
        console.error("⚠️ Error al generar transcripción:", err.message);
    }

    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (_) { }
    }, 10000);
}

function getTicketDuration(createdAt) {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} minuto${mins !== 1 ? "s" : ""}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hora${hours !== 1 ? "s" : ""} ${mins % 60}min`;
    const days = Math.floor(hours / 24);
    return `${days} día${days !== 1 ? "s" : ""} ${hours % 24}h`;
}

async function claimTicket(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";

    const isStaff = interaction.member.roles.cache.some(
        (r) => guildConfig.supportRoles.includes(r.id) || guildConfig.adminRoles.includes(r.id)
    );

    if (!isStaff) {
        return interaction.reply({
            content: t(lang, "TICKET_ONLY_STAFF_CLAIM"),
            flags: [MessageFlags.Ephemeral],
        });
    }

    const ticket = await Ticket.findOne({
        channelId: interaction.channelId,
        status: "open",
    });

    if (!ticket) {
        return interaction.reply({
            content: t(lang, "TICKET_NOT_ACTIVE"),
            flags: [MessageFlags.Ephemeral],
        });
    }

    if (ticket.claimedBy) {
        return interaction.reply({
            content: t(lang, "TICKET_ALREADY_CLAIMED", { user: `<@${ticket.claimedBy}>` }),
            flags: [MessageFlags.Ephemeral],
        });
    }

    await Ticket.updateOne(
        { channelId: interaction.channelId },
        { claimedBy: interaction.user.id, claimedByName: interaction.user.username }
    );

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(t(lang, "TICKET_CLAIMED_SUCCESS", { user: `<@${interaction.user.id}>` }))
        ],
    });
}

async function addUserToTicket(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";

    const isStaff = interaction.member.roles.cache.some(
        (r) => guildConfig.supportRoles.includes(r.id) || guildConfig.adminRoles.includes(r.id)
    );

    if (!isStaff) {
        return interaction.reply({
            content: t(lang, "TICKET_ONLY_STAFF_ADD"),
            flags: [MessageFlags.Ephemeral],
        });
    }

    const modal = new ModalBuilder()
        .setCustomId("ticket_modal_adduser")
        .setTitle(t(lang, "TICKET_MODAL_ADD_TITLE").substring(0, 45));

    const userInput = new TextInputBuilder()
        .setCustomId("user_id_input")
        .setLabel(t(lang, "TICKET_MODAL_ADD_LABEL").substring(0, 45))
        .setPlaceholder(t(lang, "TICKET_MODAL_ADD_PLACEHOLDER").substring(0, 100))
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(userInput));
    await interaction.showModal(modal);
}

export async function handleAddUserModal(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";

    const userIdRaw = interaction.fields.getTextInputValue("user_id_input");
    const userId = userIdRaw.replace(/[<@!>]/g, "").trim();

    try {
        const member = await interaction.guild.members.fetch(userId);
        await interaction.channel.permissionOverwrites.edit(member, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
        });

        await Ticket.updateOne(
            { channelId: interaction.channelId },
            { $push: { addedUsers: userId } }
        );

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setDescription(t(lang, "TICKET_USER_ADDED", { user: `<@${userId}>` }))
            ],
        });
    } catch {
        await interaction.reply({
            content: t(lang, "TICKET_USER_NOT_FOUND"),
            flags: [MessageFlags.Ephemeral],
        });
    }
}