const { SlashCommandBuilder, ContainerBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { MessageFlags } = require('discord-api-types/v10');
const { stripIndents } = require("common-tags");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('changelogs')
    .setDescription('View the most recent changes to Toastoku!'),

  async execute(interaction) {

    const changelogPages = [
      {
        description: `
        **### Community Update: Part 1.1**        
        -# **Things That Have Changed**
          -# ∘ Leave/End Game: You now need to head back to grid selection to see these buttons!
          -# ∘ Vote rewards are working again (apologies, I hadn't realised they stopped working)!

        -# **Things To Note**
          -# ∘ Mobile playability is still a work in progress, please bear with me!
        `
      },
      {
        description: `
        **### Community Update: Part 1**
        -# **Things That Have Been Added**
          -# ∘ Weekly Quests: Earn rewards for completing them within a 7 day limit.
          -# ∘ Daily Games: Solve the Daily Puzzle each day!
          -# ∘ Profiles: View your own stats across the bot.
          -# ∘ Leaderboards: Race to the top of the boards.
          -# ∘ Server Settings: Modify how the bot works in your server!
          -# ∘ Settings: Modify your own settings for the bot.
          -# ∘ Stats: View your last 10 games, completed or unfinished!
          -# ∘ Leave/End Game: Want to leave or end your game early? Now you can!
          -# ∘ Notes: You can now mark possible solutions in the game.
          -# ∘ Completion Rewards: You now earn rewards for completing games.
          -# ∘ Vote Rewards: You can now earn rewards for voting!
        
        -# **Things That Have Changed**
          -# ∘ Games: Your games now have a cleaner appearance!
          -# ∘ Hints: Hints can now be enabled/disabled for the server, uses command so no more chat input!
          -# ∘ Help: The help menu has had a complete revamp!
          -# ∘ Commands: instructions, reply-to and thought commands have been removed due to designated channels in the community!

        -# **Things To Note**
          -# ∘ Dashboard is not finished, will release in Part 2.
          -# ∘ Customisation for your profiles will be coming in Part 2.
          -# ∘ Profiles may take a minute or two to load, don't worry!
          -# ∘ Shop for more themes will be coming to the Dashboard when it is released!
          -# ∘ There is still a lot that needs implementing, future updates WILL be coming!
          -# ∘ Help menu has things listed that are not yet implemented, they will be coming though!
          -# ∘ If you have any issues, join the [Toastoku Community](https://discord.com/invite/TQNQSen7Ur).
        `
      }
    ];

    const pages = changelogPages.slice(0, 5);
    let currentPage = 0;

    const generateContainer = (pageIndex) => {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(td => td.setContent(`### 🍳 Straight From the Pan Patch Notes`))
        .addSeparatorComponents(s => s)
        .addTextDisplayComponents(td => td.setContent(stripIndents`${pages[pageIndex].description}`));

      // Create a row for buttons
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('changelog_prev')
          .setLabel('⬅️ Prev')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex === 0),

        new ButtonBuilder()
          .setCustomId('changelog_page')
          .setLabel(`${pageIndex + 1}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId('changelog_next')
          .setLabel('Next ➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex === pages.length - 1)
      );

      // Add the row to the container
      container.addActionRowComponents(buttonRow);

      return container;
    };

    const message = await interaction.reply({
      components: [generateContainer(currentPage)],
      flags: MessageFlags.IsComponentsV2,
      fetchReply: true
    });

    const collector = message.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 5 * 60 * 1000
    });

    collector.on('collect', async i => {
      if (i.customId === 'changelog_prev' && currentPage > 0) currentPage--;
      else if (i.customId === 'changelog_next' && currentPage < pages.length - 1) currentPage++;

      await i.update({ components: [generateContainer(currentPage)] });
    });

    collector.on('end', collected => {
      container = new ContainerBuilder()
        .addTextDisplayComponents(td => td.setContent('⏰ This changelog menu has expired.'))

      interaction.editReply({ components: [container] });
    });
  }
};
