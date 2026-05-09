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

// ══════════════════════════════════════════════════════
// 1. HANDLER: Select Menu → Muestra Modal
// ══════════════════════════════════════════════════════

export async function handleTicketSelect(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const categoryId = interaction.values[0];

    // Verificar si el usuario está baneado de tickets
    if (guildConfig.bannedUsers.includes(interaction.user.id)) {
        return interaction.reply({
            content: "❌ No tienes permitido abrir tickets en este servidor.",
            flags: [MessageFlags.Ephemeral],
        });
    }

    // Verificar Límite Gratuito
    if (!guildConfig.isPremium && guildConfig.totalTicketsCreated >= 50) {
        return interaction.reply({
            content: "🔒 **Límite Gratuito Alcanzado**\nEste servidor ha superado el límite de 50 tickets. El administrador debe actualizar a **Tenancy Premium** para desbloquear tickets ilimitados.",
            flags: [MessageFlags.Ephemeral],
        });
    }

    // Verificar si ya tiene un ticket abierto
    const existingTicket = await Ticket.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        status: "open",
    });

    if (existingTicket) {
        return interaction.reply({
            content: `❌ Ya tienes un ticket abierto: <#${existingTicket.channelId}>`,
            flags: [MessageFlags.Ephemeral],
        });
    }

    // Mostrar modal para el asunto
    const category = guildConfig.categories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : "General";

    const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${categoryId}`)
        .setTitle(`📝 Nuevo Ticket — ${categoryName}`);

    const subjectInput = new TextInputBuilder()
        .setCustomId("ticket_subject")
        .setLabel("¿Cuál es el motivo de tu ticket?")
        .setPlaceholder("Describe brevemente tu problema o consulta...")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(500)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(subjectInput));
    await interaction.showModal(modal);

    // Resetear el select menu del panel para que no quede "seleccionado/bloqueado"
    try {
        await interaction.message.edit({
            components: interaction.message.components,
        });
    } catch (_) { /* El mensaje pudo haber sido eliminado */ }
}

// ══════════════════════════════════════════════════════
// 2. HANDLER: Modal Submit → Crea Canal de Ticket
// ══════════════════════════════════════════════════════

export async function handleTicketModal(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const guildConfig = await getGuildConfig(interaction.guildId);
    const categoryId = interaction.customId.replace("ticket_modal_", "");
    const subject = interaction.fields.getTextInputValue("ticket_subject");

    const category = guildConfig.categories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : "General";
    const categoryEmoji = category ? category.emoji : "🎫";

    // Incrementar contador de tickets
    const newCount = (guildConfig.ticketCounter || 0) + 1;
    const newTotal = (guildConfig.totalTicketsCreated || 0) + 1;
    await updateGuildConfig(interaction.guildId, { 
        ticketCounter: newCount,
        totalTicketsCreated: newTotal 
    });

    const ticketName = `${categoryEmoji}┃ticket-${String(newCount).padStart(4, "0")}`;

    // ═══ Crear canal privado ═══
    const permissionOverwrites = [
        // Bloquear a @everyone
        {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
        },
        // Permitir al usuario que abrió
        {
            id: interaction.user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory,
            ],
        },
        // Permitir al bot
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

    // Añadir roles de soporte
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

    // Añadir roles de admin
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

    // ═══ Guardar ticket en DB ═══
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

    // ═══ Mensaje de bienvenida en el ticket ═══
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
        .setTitle(`${categoryEmoji} Ticket #${String(newCount).padStart(4, "0")}`)
        .setDescription(greeting)
        .addFields(
            { name: "📁 Categoría", value: categoryName, inline: true },
            { name: "📋 Estado", value: "🟢 Abierto", inline: true },
            { name: "👤 Reclamado por", value: "Nadie aún", inline: true },
        )
        .setFooter({ text: `ID: ${channel.id}` })
        .setTimestamp();

    // ═══ Botones de gestión ═══
    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Cerrar Ticket")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId("ticket_claim")
            .setLabel("Reclamar")
            .setEmoji("📌")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("ticket_add")
            .setLabel("Añadir Usuario")
            .setEmoji("👤")
            .setStyle(ButtonStyle.Secondary),
    );

    await channel.send({
        content: `<@${interaction.user.id}> — ${guildConfig.supportRoles.map(r => `<@&${r}>`).join(" ")}`,
        embeds: [ticketEmbed],
        components: [buttons],
    });

    // ═══ Respuesta efímera al usuario ═══
    await interaction.editReply({
        content: `✅ ¡Ticket creado! Ve a ${channel} para continuar.`,
    });
}

// ══════════════════════════════════════════════════════
// 3. HANDLER: Botones de Gestión
// ══════════════════════════════════════════════════════

export async function handleTicketButton(interaction) {
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

// ─── Cerrar Ticket ───
async function closeTicket(interaction) {
    const ticket = await Ticket.findOne({
        channelId: interaction.channelId,
        status: "open",
    });

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket activo.",
            flags: [MessageFlags.Ephemeral],
        });
    }

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle("🔒 Ticket Cerrado")
                .setDescription(`Cerrado por <@${interaction.user.id}>.\nGenerando transcripción...\nEste canal se eliminará en **10 segundos**.`)
                .setTimestamp(),
        ],
    });

    // Actualizar en DB
    await Ticket.updateOne(
        { channelId: interaction.channelId },
        {
            status: "closed",
            closedBy: interaction.user.id,
            closedAt: new Date(),
        }
    );

    // ═══ Generar Transcripción HTML ═══
    const guildConfig = await getGuildConfig(interaction.guildId);
    const ticketLabel = `ticket-${String(ticket.ticketNumber).padStart(4, "0")}`;

    try {
        const transcript = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            returnType: "attachment",
            filename: `${ticketLabel}.html`,
            poweredBy: false,
            saveImages: false,
        });

        // Enviar al canal de logs
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

        // También enviar transcripción al usuario que abrió el ticket (DM)
        try {
            const ticketUser = await interaction.client.users.fetch(ticket.userId);
            const dmEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`📋 Transcripción — Ticket #${String(ticket.ticketNumber).padStart(4, "0")}`)
                .setDescription(`Tu ticket en **${interaction.guild.name}** ha sido cerrado.\nAquí tienes la transcripción completa.`)
                .addFields(
                    { name: "Asunto", value: ticket.subject || "Sin asunto" },
                    { name: "Cerrado por", value: `<@${interaction.user.id}>` },
                )
                .setTimestamp();

            await ticketUser.send({ embeds: [dmEmbed], files: [transcript] });
        } catch (_) { /* DMs desactivados o usuario no encontrado */ }

    } catch (err) {
        console.error("⚠️ Error al generar transcripción:", err.message);
    }

    // Eliminar canal después de 10 segundos
    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (_) { /* Canal ya fue eliminado */ }
    }, 10000);
}

// ─── Calcular duración del ticket ───
function getTicketDuration(createdAt) {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} minuto${mins !== 1 ? "s" : ""}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hora${hours !== 1 ? "s" : ""} ${mins % 60}min`;
    const days = Math.floor(hours / 24);
    return `${days} día${days !== 1 ? "s" : ""} ${hours % 24}h`;
}

// ─── Reclamar Ticket ───
async function claimTicket(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);

    // Verificar que es staff
    const isStaff = interaction.member.roles.cache.some(
        (r) => guildConfig.supportRoles.includes(r.id) || guildConfig.adminRoles.includes(r.id)
    );

    if (!isStaff) {
        return interaction.reply({
            content: "❌ Solo el staff puede reclamar tickets.",
            flags: [MessageFlags.Ephemeral],
        });
    }

    const ticket = await Ticket.findOne({
        channelId: interaction.channelId,
        status: "open",
    });

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket activo.",
            flags: [MessageFlags.Ephemeral],
        });
    }

    if (ticket.claimedBy) {
        return interaction.reply({
            content: `❌ Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`,
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
                .setDescription(`📌 <@${interaction.user.id}> ha reclamado este ticket.`)
        ],
    });
}

// ─── Añadir Usuario al Ticket ───
async function addUserToTicket(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);

    const isStaff = interaction.member.roles.cache.some(
        (r) => guildConfig.supportRoles.includes(r.id) || guildConfig.adminRoles.includes(r.id)
    );

    if (!isStaff) {
        return interaction.reply({
            content: "❌ Solo el staff puede añadir usuarios.",
            flags: [MessageFlags.Ephemeral],
        });
    }

    // Mostrar modal para el ID/mención del usuario
    const modal = new ModalBuilder()
        .setCustomId("ticket_modal_adduser")
        .setTitle("👤 Añadir Usuario al Ticket");

    const userInput = new TextInputBuilder()
        .setCustomId("user_id_input")
        .setLabel("ID del usuario o mención")
        .setPlaceholder("Ej: 123456789012345678")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(userInput));
    await interaction.showModal(modal);
}

// ══════════════════════════════════════════════════════
// HANDLER EXTRA: Modal de Añadir Usuario
// ══════════════════════════════════════════════════════

// Se importa desde interactionCreate.js si el customId es "ticket_modal_adduser"
export async function handleAddUserModal(interaction) {
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
                    .setDescription(`✅ <@${userId}> ha sido añadido al ticket.`)
            ],
        });
    } catch {
        await interaction.reply({
            content: "❌ No se pudo encontrar al usuario. Verifica el ID.",
            flags: [MessageFlags.Ephemeral],
        });
    }
}
