const { PermissionsBitField, ContainerBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');
const ServerSettings = require('../../../models/serverSettings');

module.exports = async function handleServerSettingsToggle(interaction) {
    if (!interaction.customId.startsWith('server_settings_toggle_')) return;

    const settingKey = interaction.customId.replace('server_settings_toggle_', '');
    const enabledEmoji = '<:approve:1425263885241417838>'
    const disabledEmoji = '<:deny:1425263897044189216>'
    const repliedEmoji = '<:reply:1425263948155981874>'

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return interaction.reply({ content: "Only members with Manage Server permissions can toggle this setting!", flags: MessageFlags.Ephemeral });
    }

    let serverData = await ServerSettings.findOne({ guildId: interaction.guildId });
    if (!serverData) {
        serverData = new ServerSettings({ guildId: interaction.guildId, hintsEnabled: false });
        await serverData.save();
    }

    serverData[settingKey] = !serverData[settingKey];
    await serverData.save();

    const settingsList = [
        { key: 'hintsEnabled', label: 'Server Hints', description: 'Enable or disable hints for this server', value: serverData.hintsEnabled },
    ];

    const container = new ContainerBuilder()
        .addTextDisplayComponents(td => td.setContent('### ⚙️ Toastoku Settings – Only Toast Masters Allowed!'))
        .addSeparatorComponents(new SeparatorBuilder());

    for (const setting of settingsList) {
        const emoji = setting.value ? enabledEmoji : disabledEmoji;
        container.addTextDisplayComponents(td => 
            td.setContent(`${emoji} \`${setting.label}\`\n-# ${repliedEmoji} ${setting.description}`)
        );
    }

    const buttonRows = settingsList.map(setting =>
        new ButtonBuilder()
            .setCustomId(`server_settings_toggle_${setting.key}`)
            .setLabel(setting.label)
            .setStyle(setting.value ? ButtonStyle.Success : ButtonStyle.Danger)
    );

    const actionRows = buttonRows.map(btn => new ActionRowBuilder().addComponents(btn));
    container.addActionRowComponents(...actionRows);

    return interaction.update({ components: [container] });
}
