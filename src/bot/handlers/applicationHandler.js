import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } from "discord.js";
import { getGuildConfig } from "../../database/cache.js";
import { t } from "../utils/i18n.js";

// Muestra el Modal cuando hacen clic en "Aplicar"
export async function handleApplicationButton(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";
    const appId = interaction.customId.replace("app_start_", "");

    const application = guildConfig.applications?.find(a => a.id === appId);
    if (!application) {
        return interaction.reply({ content: t(lang, "APP_NO_FORMS"), flags: [MessageFlags.Ephemeral] });
    }

    const modal = new ModalBuilder()
        .setCustomId(`app_modal_${appId}`)
        .setTitle(t(lang, "APP_MODAL_TITLE", { name: application.name }).substring(0, 45));

    const questions = application.questions || [];
    for (let i = 0; i < questions.length; i++) {
        const input = new TextInputBuilder()
            .setCustomId(`app_q_${i}`)
            .setLabel(questions[i].substring(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
    }

    await interaction.showModal(modal);
}

// Procesa el ModalSubmit y envía al canal de logs de admins
export async function handleApplicationModal(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";
    const appId = interaction.customId.replace("app_modal_", "");
    
    const application = guildConfig.applications?.find(a => a.id === appId);
    if (!application) return;

    if (!guildConfig.applicationsChannelId) {
        return interaction.editReply({ content: "❌ Canal de aplicaciones no configurado por el administrador." });
    }

    const logChannel = interaction.guild.channels.cache.get(guildConfig.applicationsChannelId);
    if (!logChannel) {
        return interaction.editReply({ content: "❌ No se encontró el canal de aplicaciones." });
    }

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(t(lang, "APP_EMBED_TITLE", { name: application.name }))
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .addFields({ name: t(lang, "APP_EMBED_USER"), value: `<@${interaction.user.id}> (${interaction.user.id})` })
        .setTimestamp();

    const questions = application.questions || [];
    for (let i = 0; i < questions.length; i++) {
        const answer = interaction.fields.getTextInputValue(`app_q_${i}`);
        embed.addFields({ name: `P${i+1}: ${questions[i]}`, value: answer });
    }

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`app_accept_${appId}_${interaction.user.id}`)
            .setLabel(t(lang, "APP_BTN_ACCEPT"))
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`app_deny_${appId}_${interaction.user.id}`)
            .setLabel(t(lang, "APP_BTN_DENY"))
            .setStyle(ButtonStyle.Danger)
    );

    await logChannel.send({ embeds: [embed], components: [buttons] });

    await interaction.editReply({ content: t(lang, "APP_SUBMITTED") });
}

// Procesa la decisión (Aceptar/Rechazar) del Admin
export async function handleApplicationDecision(interaction) {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const lang = guildConfig.language || "es";

    const isStaff = interaction.member.roles.cache.some(r => guildConfig.adminRoles.includes(r.id));
    if (!isStaff) {
        return interaction.reply({ content: t(lang, "TICKET_ONLY_STAFF_CLAIM"), flags: [MessageFlags.Ephemeral] });
    }

    const [, action, appId, userId] = interaction.customId.split("_"); // app_accept_123_456
    const application = guildConfig.applications?.find(a => a.id === appId);
    if (!application) return;

    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);

    if (action === "accept") {
        if (member && application.roleToGive) {
            await member.roles.add(application.roleToGive).catch(console.error);
        }
        if (member) {
            await member.send({ content: t(lang, "APP_ACCEPTED_DM", { name: application.name, guildName: interaction.guild.name }) }).catch(()=>{});
        }
        embed.setColor(0x57F287);
        embed.setFooter({ text: t(lang, "APP_ACCEPTED_LOG", { admin: interaction.user.username }) });
    } else {
        if (member) {
            await member.send({ content: t(lang, "APP_DENIED_DM", { name: application.name, guildName: interaction.guild.name }) }).catch(()=>{});
        }
        embed.setColor(0xED4245);
        embed.setFooter({ text: t(lang, "APP_DENIED_LOG", { admin: interaction.user.username }) });
    }

    await interaction.update({ embeds: [embed], components: [] });
}
