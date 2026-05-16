import { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import Poll from "../../database/models/Poll.js";

/**
 * Handler para cuando un usuario vota en una encuesta
 * customId format: poll_vote_{pollId}_{optionIndex}
 */
export async function handlePollVote(interaction) {
    try {
        const parts = interaction.customId.split("_");
        const pollId = parts[2];
        const optionIndex = parseInt(parts[3]);

        const poll = await Poll.findById(pollId);
        if (!poll) {
            return interaction.reply({
                content: "❌ Esta encuesta ya no existe.",
                flags: [MessageFlags.Ephemeral],
            });
        }

        if (!poll.active) {
            return interaction.reply({
                content: "🔒 Esta encuesta ya ha finalizado.",
                flags: [MessageFlags.Ephemeral],
            });
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return interaction.reply({
                content: "❌ Opción inválida.",
                flags: [MessageFlags.Ephemeral],
            });
        }

        const userId = interaction.user.id;
        const previousVote = poll.voters.get(userId);

        // Si ya votó por la misma opción, quitar voto
        if (previousVote === optionIndex) {
            poll.options[optionIndex].votes = Math.max(0, poll.options[optionIndex].votes - 1);
            poll.voters.delete(userId);
            await poll.save();

            // Actualizar embed del mensaje
            await updatePollEmbed(interaction, poll);

            return interaction.reply({
                content: "🗳️ Tu voto ha sido retirado.",
                flags: [MessageFlags.Ephemeral],
            });
        }

        // Si ya votó por otra opción, mover el voto
        if (previousVote !== undefined && previousVote !== null) {
            poll.options[previousVote].votes = Math.max(0, poll.options[previousVote].votes - 1);
        }

        // Registrar nuevo voto
        poll.options[optionIndex].votes += 1;
        poll.voters.set(userId, optionIndex);
        await poll.save();

        // Actualizar embed del mensaje
        await updatePollEmbed(interaction, poll);

        const optionLabel = poll.options[optionIndex].label;
        await interaction.reply({
            content: `✅ Has votado por: **${optionLabel}**`,
            flags: [MessageFlags.Ephemeral],
        });
    } catch (error) {
        console.error("❌ Error en poll vote:", error);
        if (!interaction.replied) {
            await interaction.reply({
                content: "❌ Error al registrar tu voto.",
                flags: [MessageFlags.Ephemeral],
            }).catch(() => {});
        }
    }
}

/**
 * Actualiza el embed del mensaje de la encuesta con los votos actualizados
 */
async function updatePollEmbed(interaction, poll) {
    try {
        const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

        const resultsText = poll.options.map((opt, i) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));
            const emoji = opt.emoji || `${i + 1}️⃣`;
            return `${emoji} **${opt.label}**\n${bar} ${pct}% (${opt.votes} votos)`;
        }).join("\n\n");

        const embed = new EmbedBuilder()
            .setTitle(`📊 ${poll.question}`)
            .setDescription(resultsText)
            .setColor(0x5865F2)
            .setFooter({ text: `${totalVotes} votos totales${poll.isAnonymous ? " • Anónima" : ""} • ID: ${poll._id}` })
            .setTimestamp();

        await interaction.message.edit({ embeds: [embed] });
    } catch (error) {
        console.error("Error actualizando embed de poll:", error);
    }
}

/**
 * Construye el mensaje completo de una encuesta (para enviar a Discord)
 */
export function buildPollMessage(poll) {
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

    const resultsText = poll.options.map((opt, i) => {
        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));
        const emoji = opt.emoji || `${i + 1}️⃣`;
        return `${emoji} **${opt.label}**\n${bar} ${pct}% (${opt.votes} votos)`;
    }).join("\n\n");

    const embed = new EmbedBuilder()
        .setTitle(`📊 ${poll.question}`)
        .setDescription(resultsText)
        .setColor(0x5865F2)
        .setFooter({ text: `${totalVotes} votos totales${poll.isAnonymous ? " • Anónima" : ""} • ID: ${poll._id}` })
        .setTimestamp();

    const rows = [];
    // Máximo 5 botones por fila, máximo 5 filas
    for (let i = 0; i < poll.options.length; i += 5) {
        const row = new ActionRowBuilder();
        const chunk = poll.options.slice(i, i + 5);
        chunk.forEach((opt, j) => {
            const idx = i + j;
            const btn = new ButtonBuilder()
                .setCustomId(`poll_vote_${poll._id}_${idx}`)
                .setLabel(opt.label)
                .setStyle(ButtonStyle.Primary);
            if (opt.emoji) {
                try { btn.setEmoji(opt.emoji); } catch (e) {}
            }
            row.addComponents(btn);
        });
        rows.push(row);
    }

    return { embeds: [embed], components: rows };
}
