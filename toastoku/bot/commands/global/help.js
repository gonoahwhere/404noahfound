const { SlashCommandBuilder, StringSelectMenuBuilder, ContainerBuilder, ActionRowBuilder } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Sudoku guidance served with a side of humor 🥪"),
  async execute(interaction) {
    const selectMenuRow = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('toastoku_help_menu')
          .setPlaceholder('Select a category...')
          .addOptions([
            { label: '🎮 Modes', value: 'modes_menu' },
            { label: '🎨 Themes', value: 'themes_menu' },
            { label: '✏️ Notes', value: 'notes_menu' },
            { label: '💡 Smart Hints', value: 'hints_menu' },
            { label: '🏆 Daily / Community Goals', value: 'goals_menu' },
            { label: '📅 Weekly Quests', value: 'quests_menu' },
            { label: '💰 Economy', value: 'economy_menu' },
            { label: '🏅 Leaderboards', value: 'leaderboards_menu' },
            { label: '⭐ Vote Rewards', value: 'vote_menu' },
            { label: '👤 Profiles', value: 'profiles_menu' },
            { label: '📊 Stats', value: 'stats_menu' },
            { label: '📖 Instructions', value: 'instructions_menu' },
            { label: '🎁 Bonuses', value: 'bonuses_menu' },
            { label: '💻 Dashboard', value: 'dashboard_menu' },
            { label: '⚙️ Commands', value: 'commands_menu' },
          ])
      );

    const container = new ContainerBuilder()
      .addTextDisplayComponents(td =>
        td.setContent(`### 🧠 Toastoku HQ – Feed Your Brain!`)
      )
      .addTextDisplayComponents(td => 
        td.setContent(`-# Sudoku with a crunch! Pick a menu below and see if your brain can handle it.\n`)
      )
      .addSeparatorComponents(s => s)
      .addTextDisplayComponents(td => 
        td.setContent(
          `-# **Modes** – Overview of all gameplay modes in Toastoku.\n` + 
          `-# **Themes** – How to customize and apply different themes.\n` +
          `-# **Notes** – Tips on using notes effectively.\n` +
          `-# **Smart Hints** – Learn how hints can help you solve puzzles.\n` +
          `-# **Daily & Community Goals** – Complete daily challenges and community objectives.\n` +
          `-# **Weekly Quests** – Track and complete weekly quests for rewards.\n` +
          `-# **Economy** – Manage your Toasts and understand the in-game economy.\n` +
          `-# **Leaderboards** – See where you rank against other players.\n` +
          `-# **Vote Rewards** – How voting benefits you with rewards.\n` +
          `-# **Profiles** – View and manage your user profile.\n` +
          `-# **Stats** – Check detailed statistics and performance.\n` +
          `-# **Instructions** – A quick guide to using Toastoku efficiently.\n` +
          `-# **Bonuses** – Learn about boosters and extra rewards.\n` +
          `-# **Dashboard** – Navigate the Dashboard to track progress.\n` +
          `-# **Commands** – Full list of available commands in Toastoku.`
        )
      )
      .addSeparatorComponents(s => s)
      .addActionRowComponents(selectMenuRow);
    
    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
}
