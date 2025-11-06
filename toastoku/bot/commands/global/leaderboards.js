const { SlashCommandBuilder, ContainerBuilder, SeparatorBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');
const Profile = require('../../../models/userProfile');
const mongoose = require('mongoose');
const BigNumber = require('bignumber.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the richest users across Toastoku!'),

  async execute(interaction) {
    let member = interaction.user;

    const selectMenuRow = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('toastoku_leaderboard_menu')
          .setPlaceholder('Select a category...')
          .addOptions([
            { label: '🍞 Current Toasts', value: 'current_toasts_menu' },
            { label: '🍞 Spent Toasts', value: 'spent_toasts_menu' },
            { label: '🍞 Total Toasts', value: 'total_toasts_menu' },
            { label: '🏆 Ranks', value: 'ranks_menu' },
            { label: '🎮 Games', value: 'games_toastoku_menu' },
            { label: '⭐ Votes', value: 'votes_toastoku_menu' },
          ])
      );

    const container = new ContainerBuilder()
      .addTextDisplayComponents(td =>
        td.setContent(`### 🏆 Toastoku Leaderboards – Brainpower Rankings!`)
      )
      .addTextDisplayComponents(td => 
        td.setContent(`-# See who's the crispiest brain in the bakery.`)
      )
      .addSeparatorComponents(s => s)
      .addTextDisplayComponents(td => 
        td.setContent(
            `-# **Current Toasts** – Top 10 users with the most unspent toasts.\n` +
            `-# **Spent Toasts** – Top 10 users who’ve spent the most toasts.\n` +
            `-# **Total Toasts** – Top 10 users with the highest combined total.\n` +
            `-# **Ranks** – Top 10 users with the highest levels.\n` +
            `-# **Games** – Top 10 users with the most games played.\n` +
            `-# **Votes** – Top 10 users with the highest votes.`
        )
    )
      .addSeparatorComponents(s => s)
      .addActionRowComponents(selectMenuRow);
    
    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
