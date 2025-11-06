const { ContainerBuilder, MediaGalleryItemBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ActionRowBuilder } = require("discord.js");
const { titleCase, createLobbyButtons, getTurnEmbedFields, drawSudokuGrid } = require('../../commands/global/sudoku');
const { MessageFlags } = require('discord-api-types/v10');
const { games } = require('../../../utils/games.js');
const mongoose = require('mongoose');
const SudokuGame = require('../../../models/sudokuGame');

module.exports = async function handleLeaveGameLobby(interaction) {
    if (interaction.customId !== 'leave_game_lobby') return;

    const multiplayerGame = await SudokuGame.findOne({
        gameId: { $regex: `^sudoku-${interaction.channelId}-` }
    });

    if (!multiplayerGame) {
        return interaction.reply({ content: 'No ongoing multiplayer game found in this channel!', flags: MessageFlags.Ephemeral });
    }

    const userId = interaction.user.id;
    const hostId = multiplayerGame.hostId;

    if (userId === hostId) {
        return interaction.reply({ content: 'The host cannot leave the lobby. Use "End Game" instead.', flags: MessageFlags.Ephemeral });
    }

    if (!multiplayerGame.joinedPlayers.includes(userId)) {
        return interaction.reply({ content: 'You are not part of this lobby!', flags: MessageFlags.Ephemeral });
    }

    const gameId = multiplayerGame.gameId;

    multiplayerGame.joinedPlayers = multiplayerGame.joinedPlayers.filter(id => id !== userId);

    games.set(gameId, multiplayerGame);
    await SudokuGame.updateOne({ gameId }, { joinedPlayers: multiplayerGame.joinedPlayers, lastUpdated: Date.now() });

    const fields = getTurnEmbedFields(multiplayerGame);
    const percent = Math.floor(multiplayerGame.puzzle.filter(n => n !== null).length / 81 * 100);
    const buffer = await drawSudokuGrid(multiplayerGame.puzzle, new Set(multiplayerGame.prefilledSet), multiplayerGame.theme, null, null, null, multiplayerGame.conflictSet);
    const attachment = new AttachmentBuilder(buffer, { name: 'sudoku.png' });
    let buttonRows = createLobbyButtons(multiplayerGame, interaction.user.id);

    if (multiplayerGame.joinedPlayers.length === 1 && multiplayerGame.joinedPlayers[0] === hostId) {
        if (buttonRows.length === 0) {
            buttonRows.push(new ActionRowBuilder());
        }

        buttonRows[buttonRows.length - 1].addComponents(
            new ButtonBuilder()
            .setCustomId('end_game_lobby')
            .setLabel('End Game')
            .setStyle(ButtonStyle.Danger)
        );
    }

    const container = new ContainerBuilder()
        .addTextDisplayComponents(td => td.setContent(`### ${titleCase(multiplayerGame.theme)} Sudoku ∘ ${titleCase(multiplayerGame.difficulty)} [${percent}%]`))
        .addMediaGalleryComponents(g => g.addItems(
            new MediaGalleryItemBuilder()
                .setURL(`attachment://${attachment.name}`)
        ));

    if (multiplayerGame.mode === 'multi') {
        const turnInfo = fields.map(f => `${f.name}: ${f.value}`).join('\n');
        container.addSeparatorComponents(s => s).addTextDisplayComponents(td => td.setContent(turnInfo));
    }

    container.addSeparatorComponents(s => s).addActionRowComponents(...buttonRows.filter(Boolean));

    return interaction.update({ components: [container], files: [attachment] });
}
