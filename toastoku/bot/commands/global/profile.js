const { SlashCommandBuilder, ContainerBuilder, StringSelectMenuBuilder, ActionRowBuilder, SeparatorBuilder, AttachmentBuilder, MediaGalleryItemBuilder, ComponentType } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');
const Profile = require('../../../models/userProfile');
const mongoose = require('mongoose');
const BigNumber = require('bignumber.js');
const { LevelingSystem, RankCardBuilder } = require('xp-flow');
const { totalXpForLevel } = require('../../../utils/xpManager');
const { generateGamertag } = require("gamertag-forge");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your bot\'s profile!'),

  async execute(interaction) {
    await interaction.deferReply()

    let selectMenuRow = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('toastoku_profile_menu')
          .setPlaceholder('Select a category...')
          .addOptions([
            { label: '🍞 Game', value: 'profile_main_menu' },
            { label: '⭐ Level', value: 'profile_ranks_menu' },
            { label: '✨ Miscellaneous', value: 'profile_misc_menu' },
            { label: '⚙️ Settings', value: 'profile_settings_menu' },
        ])
      );

    let dbConfig = {
      type: 'mongodb',
       uri: process.env.MongoURI
    };

    let targetUser = interaction.user;
    let support_team = ['372456601266683914', '794323707115470928'];
    let bot_devs = ['372456601266683914', '794323707115470928'];
    let bot_owner = '372456601266683914'

    let badgeEmojis = {
      support: '<:bot_supporter:1425266845891428374>',
      owner: '<:bot_owner:1425266830389415947>',
      dev: '<:bot_dev:1425266821690560522>',
    }

    let badges = [];
    if (targetUser.id === bot_owner) badges.push('owner');
    if (bot_devs.includes(targetUser.id)) badges.push('dev');
    if (support_team.includes(targetUser.id)) badges.push('support');
    let profileData = await Profile.findOne({ userId: targetUser.id });
    if (!profileData) {
      let unique = false;
      let anonymousName;
      while (!unique) {
        anonymousName = generateGamertag({ style: "bakery", minNumber: 0, maxNumber: 999999999 });
        let exists = await Profile.findOne({ anonymousName });
        if (!exists) unique = true;
      }

      profileData = new Profile({
        _id: new mongoose.Types.ObjectId(),
        userId: targetUser.id,
        anonymousName: anonymousName
      });
      await profileData.save();
    }

    for (let badgeKey of profileData.achieve.badges) {
      if (badgeEmojis[badgeKey]) badges.push(badgeKey)
    }

    let displayBadges = badges.map(id => badgeEmojis[id]).join('  ') || '`No badges to display.`';
    let suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg", "Uvg", "Dvg", "Tvg", "Qavg", "Qivg", "Sxvg", "Spvg", "Ocv", "Novg", "Tg"];
    function formatValue(num) {
      num = new BigNumber(num);
      if (num.isLessThan(1000)) return num.toString();
      let expStr = num.toExponential(2);
      let [mantissa, exponent] = expStr.split('e');
      let exp = Math.floor(parseInt(exponent) / 3);
      let suffix = suffixes[exp] || "e" + (exp * 3);
      let divisor = new BigNumber(1000).pow(exp);
      return num.div(divisor).toFixed(2) + suffix;
    }

    let hints = new BigNumber(profileData.misc.hints || "0");
    let dailyHints = new BigNumber(profileData.misc.dailyHints || "0");
    let gamesPlayed = new BigNumber(profileData.misc.gamesPlayed || "0");
    let boosters = new BigNumber(profileData.misc.boosters || "0");
    let exp = new BigNumber(profileData.rank.exp || "0");
    let currentToasts = new BigNumber(profileData.balance.currentToasts || "0");
    let spentToasts = new BigNumber(profileData.balance.spentToasts || "0");
    let totalToasts = currentToasts.plus(spentToasts);
    let votes = new BigNumber(profileData.misc.votes || "0");
    let anony = profileData.anonymous || false;
    let displayAnony = anony ? "True" : "False";

    let computedLevel = 0;
    while (exp.gte(totalXpForLevel(computedLevel + 1))) {
        computedLevel++;
    }

    profileData.rank.level = computedLevel.toString();
    await profileData.save();
    let xpForCurrentLevel = totalXpForLevel(computedLevel);
    let xpForNextLevel = totalXpForLevel(computedLevel + 1);
    let progressBN = exp.minus(xpForCurrentLevel);
    let neededBN = xpForNextLevel.minus(xpForCurrentLevel);
    let MAX_SAFE_XP = new BigNumber('1e93');
    let progressSafe = BigNumber.min(progressBN, MAX_SAFE_XP);
    let neededSafe = BigNumber.min(neededBN, MAX_SAFE_XP);
    let leveling = new LevelingSystem({ database: dbConfig });
    let card = new RankCardBuilder({
      username: targetUser.username,
      avatarUrl: targetUser.displayAvatarURL({ extension: 'png' }),
    })
      .setLevel(computedLevel)
      .setCurrentXp(progressSafe.toNumber())
      .setRequiredXp(neededSafe.toNumber())
      .setBackgroundColor('#2a2e35')
      .setXpBarColor('#FFB703');

    let imageBuffer = await leveling.createRankCard(card);
    let attachment = new AttachmentBuilder(imageBuffer, { name: 'rank-card.png' });

    let container = new ContainerBuilder()
      .addTextDisplayComponents(td =>
        td.setContent(`### 🍞 Toastoku Profile – Loaf Legends!`)
      )
      .addTextDisplayComponents(td => 
        td.setContent(`-# Discover how golden your own loaf of genius is.`)
      )
      .addSeparatorComponents(s => s)
      .addTextDisplayComponents(td => 
        td.setContent(
            `-# **Game** – Your balance across the bot.\n` +
            `-# **Level** – Your rank card, displaying your level.\n` +
            `-# **Miscellaneous** – Random extra oddities!\n` +
            `-# **Settings** – View what settings you have enabled/disabled.`
        )
    )
      .addSeparatorComponents(s => s)
      .addActionRowComponents(selectMenuRow);

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

      let message = await interaction.fetchReply();
      let collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: i => i.user.id === interaction.user.id,
        time: 1 * 60 * 1000 
      });

    collector.on('collect', async i => {
      switch (i.values[0]) {
        case 'profile_main_menu':
          container = new ContainerBuilder()
            .addTextDisplayComponents(td => td.setContent(`### <:toast:1425265164139102238> Toasts`))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(td => td.setContent(
              `• Current: \`${formatValue(currentToasts)}\`\n` +
              `• Spent: \`${formatValue(spentToasts)}\`\n` +
              `• Total: \`${formatValue(totalToasts)}\`\n` +
              `• Games Played: \`${formatValue(gamesPlayed)}\`\n` +
              `• Hints: \`${formatValue(hints)}\`\n` +
              `• Daily Hints: \`${formatValue(dailyHints)}\``
            ))
            .addSeparatorComponents(s => s)
            .addActionRowComponents(selectMenuRow);
          break;

        case 'profile_ranks_menu':
          container = new ContainerBuilder()
            .addTextDisplayComponents(td => td.setContent(`### ⭐ Rank Card`))
            .addSeparatorComponents(s => s)
            .addMediaGalleryComponents(g =>
              g.addItems(
                new MediaGalleryItemBuilder()
                  .setDescription('Your Rank Card')
                  .setURL(`attachment://${attachment.name}`)
              )
            )
            .addSeparatorComponents(s => s)
            .addActionRowComponents(selectMenuRow);
          break;

        case 'profile_misc_menu':
          container = new ContainerBuilder()
            .addTextDisplayComponents(td => td.setContent(`### ✨ Miscellaneous`))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(td => td.setContent(
              `• Boosters: \`${formatValue(boosters)}\`\n` +
              `• Votes: \`${formatValue(votes)}\``
            ))
            .addSeparatorComponents(s => s)
            .addActionRowComponents(selectMenuRow);
          break;

        case 'profile_settings_menu':
          container = new ContainerBuilder()
            .addTextDisplayComponents(td => td.setContent(`### ⚙️ Settings`))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(td => td.setContent(`• Anonymous: \`${displayAnony}\``))
            .addSeparatorComponents(s => s)
            .addActionRowComponents(selectMenuRow);
          break;

        default: return;
      }

      await i.update({ components: [container], files: [attachment] });
    });

  collector.on('end', collected => {
    container = new ContainerBuilder()
      .addTextDisplayComponents(td => td.setContent('⏰ This profile menu has expired.'))

    interaction.editReply({ components: [container] });
  });
  }
};
