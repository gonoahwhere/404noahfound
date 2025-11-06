const { ContainerBuilder, MediaGalleryItemBuilder, AttachmentBuilder } = require("discord.js");
const { titleCase, drawSudokuGrid } = require('../../commands/global/sudoku');
const { MessageFlags } = require('discord-api-types/v10');
const { games } = require('../../../utils/games.js');
const mongoose = require('mongoose');
const SudokuGame = require('../../../models/sudokuGame');
const logFinishedGame = require('../../../utils/gameHistory.js');
const Profile = require('../../../models/userProfile');
const BigNumber = require('bignumber.js');
const { updateWeeklyQuestsFromGame } = require("../../../utils/updateQuests");

module.exports = async function handleEndGame(interaction) {
    if (interaction.customId !== 'end_game') return;

    const today = new Date().toISOString().split('T')[0];

    let game = await SudokuGame.findOne({gameId: { $regex: `^sudoku-${interaction.channelId}-` }, $or: [ { hostId: interaction.user.id }, { joinedPlayers: interaction.user.id } ]});

    if (!game) {
        game = await SudokuGame.findOne({gameId: { $regex: `^sudoku-daily-${today}-` }, hostId: interaction.user.id });
    }

    if (!game) {
        return interaction.reply({ content: 'You are not part of any active Sudoku game today!', flags: MessageFlags.Ephemeral });
    }

    const gameId = game.gameId;
    let gameState = games.get(gameId);

    if (!gameState) {
        const savedGame = await SudokuGame.findOne({ gameId });

        if (!savedGame) {
            return interaction.reply({ content: 'No active Sudoku game found!', flags: MessageFlags.Ephemeral });
        }

        gameState = {
            ...savedGame.toObject(),
            pencilMode: savedGame.pencilMode || false,
            prefilledSet: new Set(savedGame.prefilledSet),
            conflictSet: new Set(savedGame.conflictSet),
            notes: savedGame.notes ? savedGame.notes.map(arr => new Set(arr)) : Array.from({ length: 81 }, () => new Set()),
        };
    }

    await logFinishedGame(gameState, false);
    let profileData = await Profile.findOne({ userId: interaction.user.id });

    if (!profileData) {
        profileData = new Profile({ _id: new mongoose.Types.ObjectId(), userId: interaction.user.id });
        await profileData.save();
    }

    let gamesPlayed = new BigNumber(profileData.misc.gamesPlayed || "0");
    gamesPlayed = gamesPlayed.plus(1);
    profileData.misc.gamesPlayed = gamesPlayed.toString();
    await profileData.save();

    const options = {
        solved: false,
        daily: gameState.mode === 'daily' ? 1 : 0,
        toastEarned: 0,
        expEarned: 0,
        hintsCollected: 0,
        hintsUsed: 0,
        customThemesCompleted: 0,
        endedEarly: true,
    };

    if (gameState.mode === 'daily') {
        await updateWeeklyQuestsFromGame(interaction.user.id, gameState, options, interaction.user);
    } else {
        await updateWeeklyQuestsFromGame(interaction.user.id, gameState, options, interaction.channel);
    }

    games.delete(gameId);
    await SudokuGame.deleteOne({ gameId });

    const filledCells = gameState.puzzle.filter(n => n !== null).length;
    const percent = Math.floor((filledCells / 81) * 100);
    const buffer = await drawSudokuGrid(gameState.puzzle, gameState.prefilledSet, gameState.theme, null, null, null, gameState.conflictSet, gameState.notes.map(s => Array.from(s)));
    const attachment = new AttachmentBuilder(buffer, { name: 'sudoku.png' });

    const container = new ContainerBuilder()
    .addTextDisplayComponents(td => td.setContent(`### ${gameId.startsWith('sudoku-daily-') ? 'Daily' : titleCase(gameState.theme)} Sudoku ∘ ${titleCase(gameState.difficulty)} [${percent}%]\n\nThe game has been terminated by the final player.`))
    .addMediaGalleryComponents(g => g.addItems(new MediaGalleryItemBuilder().setURL(`attachment://${attachment.name}`)));

    return interaction.update({ components: [container], files: [attachment] });
}
