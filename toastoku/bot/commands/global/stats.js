const { SlashCommandBuilder, ContainerBuilder, MediaGalleryItemBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ActionRowBuilder } = require('discord.js');
const { MessageFlags } = require('discord-api-types/v10');
const UserGameHistory = require('../../../models/userGameHistory');
const { drawSudokuGrid } = require('../../commands/global/sudoku');

let currentIndex = 0;

function titleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View your last 10 Sudoku games!'),

  async execute(interaction) {
    const targetUser = interaction.user;

    const logFinishedGame = await UserGameHistory.find({ userId: targetUser.id })
      .sort({ gameIndex: -1 })
      .limit(10);

    if (!logFinishedGame.length) {
      return interaction.reply({ content: `You have no recent games!`, flags: MessageFlags.Ephemeral });
    }

    const game = logFinishedGame[currentIndex];
    const d = new Date(game.date);
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    let typeLabel;
    if (game.type === 'single') typeLabel = 'Singleplayer';
    else if (game.type === 'multi') typeLabel = 'Multiplayer';
    else if (game.type === 'daily') typeLabel = 'Daily';
    else typeLabel = 'Unknown';
    const theme = game.theme;
    const difficulty = game.difficulty;
    const status = game.completed ? 'Completed' : 'Ended Early';
    const filledCells = game.puzzle.filter(n => n !== null).length;
    const percent = Math.floor((filledCells / 81) * 100);
    const notes = game.notes.map(s => new Set(s));
    const prefilledSet = new Set(game.prefilledSet || []);
    const gameIndex = game.gameIndex;

    const buffer = await drawSudokuGrid(game.puzzle, prefilledSet, game.theme, null, null, null, new Set(), notes);
    const attachment = new AttachmentBuilder(buffer, { name: 'sudoku.png' });

    const prevStatsButton = new ButtonBuilder()
        .setCustomId('stats_command_prev')
        .setLabel('⬅️ Prev')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentIndex === 0)

    const pageStatsButton = new ButtonBuilder()
        .setCustomId('stats_command_page')
        .setLabel(`${currentIndex + 1}/${logFinishedGame.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
        
    const nextStatsButton = new ButtonBuilder()
        .setCustomId('stats_command_next')
        .setLabel('Next ➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentIndex === logFinishedGame.length - 1)
    
    const container = new ContainerBuilder()
    .addTextDisplayComponents(td => td.setContent(`### ${targetUser.username}'s Stats [#${currentIndex + 1}]`))
    .addMediaGalleryComponents(g => g.addItems(
        new MediaGalleryItemBuilder()
        .setDescription('Sudoku board')
        .setURL('attachment://sudoku.png')
    ))
    .addSeparatorComponents(s => s)
    .addTextDisplayComponents(td => td.setContent(`Status: ${status}\nType: ${titleCase(typeLabel)}\nDifficulty: ${titleCase(difficulty)}\nTheme: ${titleCase(theme)}\nPercent Complete: ${percent}%\nDate: ${date}`))
    .addSeparatorComponents(s => s)
    .addActionRowComponents(new ActionRowBuilder().addComponents(prevStatsButton, pageStatsButton, nextStatsButton));

    await interaction.reply({ components: [container], files: [attachment], flags: MessageFlags.IsComponentsV2 });
  }
};
