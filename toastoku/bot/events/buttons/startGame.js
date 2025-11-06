const { ContainerBuilder, MediaGalleryItemBuilder, AttachmentBuilder } = require("discord.js");
const { titleCase, createGridButtons, getTurnEmbedFields, drawSudokuGrid } = require('../../commands/global/sudoku');
const { MessageFlags } = require('discord-api-types/v10');
const { games } = require('../../../utils/games.js');
const mongoose = require('mongoose');
const SudokuGame = require('../../../models/sudokuGame');

let gameId;
let hostUserId;

module.exports = async function handleStartGame(interaction) {
    if (interaction.customId !== 'start_game') return;

    const multiplayerGame = await SudokuGame.findOne({ gameId: { $regex: `^sudoku-${interaction.channelId}-` } });
    if (!multiplayerGame) {
        return interaction.reply({ content: 'No ongoing multiplayer game found in this channel!', flags: MessageFlags.Ephemeral });
    }

    if (multiplayerGame.started) {
        return interaction.reply({ content: 'This game has already started.', flags: MessageFlags.Ephemeral });
    }
    
    hostUserId = multiplayerGame.hostId;
    gameId = `sudoku-${interaction.channelId}-${hostUserId}`;

    if (interaction.user.id !== hostUserId || interaction.user.id !== multiplayerGame.hostId) {
        return interaction.reply({ content: 'Only the host can start the game!', flags: MessageFlags.Ephemeral });
    } if (multiplayerGame.joinedPlayers.length < 2) {
        return interaction.reply({ content: 'At least 2 players are required to start the game.', flags: MessageFlags.Ephemeral });
    } else {
        multiplayerGame.started = true;
        multiplayerGame.currentTurnIndex = 0;
        games.set(gameId, multiplayerGame);
        await SudokuGame.updateOne({ gameId }, { started: true, currentTurnIndex: 0, messageId: multiplayerGame.messageId });

        const percent = Math.floor(multiplayerGame.puzzle.filter(n => n !== null).length / 81 * 100);
        const buffer = await drawSudokuGrid(multiplayerGame.puzzle, new Set(multiplayerGame.prefilledSet), multiplayerGame.theme, null, null, null, multiplayerGame.conflictSet);
        const attachment = new AttachmentBuilder(buffer, { name: 'sudoku.png' });

        const buttonRows = createGridButtons(multiplayerGame, multiplayerGame.joinedPlayers[0]);
        const fields = getTurnEmbedFields(multiplayerGame);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(td => td.setContent(`### ${titleCase(multiplayerGame.theme)} Sudoku ∘ ${titleCase(multiplayerGame.difficulty)} [${percent}%]`))
            .addMediaGalleryComponents(g => g.addItems(
                new MediaGalleryItemBuilder()
                  .setURL(`attachment://${attachment.name}`)
            ));

        if (multiplayerGame.mode === 'multi') {
            let turnInfo = fields.map(f => `${f.name}: ${f.value}`).join('\n');
            container.addSeparatorComponents(s => s)
            container.addTextDisplayComponents(td => td.setContent(turnInfo));
        }

        container.addSeparatorComponents(s => s).addActionRowComponents(...buttonRows.filter(Boolean));

        return interaction.update({ components: [container], files: [attachment] });
    }
}
