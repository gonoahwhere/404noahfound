const { ContainerBuilder, MediaGalleryItemBuilder, AttachmentBuilder } = require("discord.js");
const { titleCase, getTurnEmbedFields, createNumberButtons, drawSudokuGrid } = require('../../commands/global/sudoku');
const { MessageFlags } = require('discord-api-types/v10');
const { games } = require('../../../utils/games.js');
const mongoose = require('mongoose');
const SudokuGame = require('../../../models/sudokuGame');

module.exports = async function handlePencilMode(interaction) {
    if (interaction.customId !== 'pencil_mode') return;

    const today = new Date().toISOString().split('T')[0];
    let gameId;

    let game = await SudokuGame.findOne({ gameId: { $regex: `^sudoku-${interaction.channelId}-` }, $or: [ { hostId: interaction.user.id }, { joinedPlayers: interaction.user.id } ]});

    if (!game) {
        game = await SudokuGame.findOne({ gameId: { $regex: `^sudoku-daily-${today}-` }, hostId: interaction.user.id });
    }

    if (!game) {
        return interaction.reply({ content: 'No active Sudoku game found!', flags: MessageFlags.Ephemeral });
    }

    gameId = game.gameId;
    let gameState = games.get(gameId);

    if (!gameState) {
        const savedGame = await SudokuGame.findOne({ gameId });
        gameState = {
            ...savedGame.toObject(),
            pencilMode: savedGame.pencilMode || false,
            prefilledSet: new Set(savedGame.prefilledSet),
            conflictSet: new Set(savedGame.conflictSet),
            notes: savedGame.notes ? savedGame.notes.map(arr => new Set(arr)) : Array.from({ length: 81 }, () => new Set()),
        };
    }

    if (gameState.mode === 'multi') {
        const currentPlayerId = gameState.joinedPlayers[gameState.currentTurnIndex % gameState.joinedPlayers.length];
        if (interaction.user.id !== currentPlayerId) {
            return interaction.reply({ content: "It's not your turn! Only the current player can toggle Pencil Mode.", flags: MessageFlags.Ephemeral });
        }
    }

    gameState.pencilMode = !gameState.pencilMode;
    games.set(gameId, gameState);
    await SudokuGame.updateOne({ gameId }, { pencilMode: gameState.pencilMode, lastUpdated: Date.now(), messageId: gameState.messageId });
    const buffer = await drawSudokuGrid( gameState.puzzle, gameState.prefilledSet, gameState.theme, gameState.selectedCell, null, gameState.selectedGrid, gameState.conflictSet, gameState.notes.map(s => Array.from(s)));
    const attachment = new AttachmentBuilder(buffer, { name: 'sudoku.png' });
    const buttonRows = createNumberButtons(gameState.theme, new Set(gameState.prefilledSet), gameState.puzzle, gameState.selectedCell, gameState.mode, gameState.pencilMode, gameState.joinedPlayers);
    const percent = Math.floor(gameState.puzzle.filter(n => n !== null).length / 81 * 100);
    const fields = getTurnEmbedFields(gameState);

    const container = new ContainerBuilder()
        .addTextDisplayComponents(td => td.setContent(`### ${gameId.startsWith('sudoku-daily-') ? 'Daily' : titleCase(gameState.theme)} Sudoku ∘ ${titleCase(gameState.difficulty)} [${percent}%]`))
        .addMediaGalleryComponents(g => g.addItems( new MediaGalleryItemBuilder().setURL(`attachment://${attachment.name}`)));

    if (gameState.mode === 'multi') {
        const turnInfo = fields.map(f => `${f.name}: ${f.value}`).join('\n');
        container.addSeparatorComponents(s => s).addTextDisplayComponents(td => td.setContent(turnInfo));
    }

    container.addSeparatorComponents(s => s).addActionRowComponents(...buttonRows.filter(Boolean));

    return interaction.update({ components: [container], files: [attachment] });
}
