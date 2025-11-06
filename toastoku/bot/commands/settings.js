const { SlashCommandBuilder, ContainerBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');
const Profile = require('../../../models/userProfile');
const mongoose = require('mongoose');
const BigNumber = require('bignumber.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('View or edit your bot settings here!')
    .addSubcommand(sub =>
        sub.setName('view').setDescription('View your current bot settings')
    )
    .addSubcommand(sub =>
        sub.setName('edit').setDescription('Edit your current bot settings')
    ),
  async execute(interaction) {
    const member = interaction.user;
    let subcommand = interaction.options.getSubcommand();
    
    let profileData = await Profile.findOne({ userId: member.id });
    if (!profileData) {
      profileData = new Profile({ _id: new mongoose.Types.ObjectId(), userId: member.id });
      await profileData.save();
    }

    const settingsList = [
      { key: 'anonymous', label: 'Anonymous Mode', description: 'Hide your username on leaderboards', value: profileData.anonymous },
    ];

    let enabledEmoji = '<:approve:1425263885241417838>'
    let disabledEmoji = '<:deny:1425263897044189216>'
    let repliedEmoji = '<:reply:1425263948155981874>'

    if (subcommand === 'view') {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(td => td.setContent('### ⚙️ Toastoku Settings – Manage Your Toasty Life!'))
            .addSeparatorComponents(new SeparatorBuilder())
        
        for (const setting of settingsList) {
            const emoji = setting.value ? enabledEmoji : disabledEmoji;
            container.addTextDisplayComponents(td => td.setContent(`${emoji} \`${setting.label}\`\n-# ${repliedEmoji} ${setting.description}`))
        }

        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (subcommand === 'edit') {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(td => td.setContent('### ⚙️ Toastoku Settings – Manage Your Toasty Life!'))
            .addSeparatorComponents(new SeparatorBuilder());

        for (const setting of settingsList) {
            const emoji = setting.value ? enabledEmoji : disabledEmoji;
            container.addTextDisplayComponents(td => 
                td.setContent(`${emoji} \`${setting.label}\`\n-# ${repliedEmoji} ${setting.description}`)
            );
        }

        const buttonRows = settingsList.map(setting =>
            new ButtonBuilder()
                .setCustomId(`settings_toggle_${setting.key}`)
                .setLabel(setting.label)
                .setStyle(setting.value ? ButtonStyle.Success : ButtonStyle.Danger)
        );

        const actionRows = buttonRows.map(btn => new ActionRowBuilder().addComponents(btn));

        container.addActionRowComponents(...actionRows);

        await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
