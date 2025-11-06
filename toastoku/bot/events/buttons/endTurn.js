const { ContainerBuilder, MediaGalleryItemBuilder, AttachmentBuilder } = require("discord.js");
const { titleCase, createGridButtons, getTurnEmbedFields, drawSudokuGrid, isPuzzleInSolutions } = require('../../commands/global/sudoku');
const { MessageFlags } = require('discord-api-types/v10');
const { games } = require('../../../utils/games.js');
const mongoose = require('mongoose');
const SudokuGame = require('../../../models/sudokuGame');
const DailyCompletion = require('../../../models/dailyCompletion');
const logFinishedGame = require('../../../utils/gameHistory.js');
const Profile = require('../../../models/userProfile');
const BigNumber = require('bignumber.js');
const { grantGameRewards } = require('../../../utils/rewards');
const { updateWeeklyQuestsFromGame } = require("../../../utils/updateQuests");

let gameId;

module.exports = async function handleEndTurn(interaction) {
    if (interaction.customId !== 'end_turn') return;

    let multiplayerGame = await SudokuGame.findOne({ gameId: { $regex: `^sudoku-${interaction.channelId}-` }, $or: [ { hostId: interaction.user.id }, { joinedPlayers: interaction.user.id } ]});

    if (multiplayerGame) {
        gameId = multiplayerGame.gameId;
    } else {
        if (interaction.channelId) {
            gameId = `sudoku-${interaction.channelId}-${interaction.user.id}`;
        } else {
            gameId = `sudoku-user-${interaction.user.id}`;
        }
    }

    let gameState = games.get(gameId);
    if (!gameState) {
        const savedGame = await SudokuGame.findOne({ gameId });
        if (!savedGame) return interaction.reply({ content: 'No active Sudoku game found for you!', flags: MessageFlags.Ephemeral });

        gameState = {
            ...savedGame.toObject(),
            pencilMode: savedGame.pencilMode || false,
            prefilledSet: new Set(savedGame.prefilledSet),
            conflictSet: new Set(savedGame.conflictSet),
            notes: savedGame.notes ? savedGame.notes.map(arr => new Set(arr)) : Array.from({ length: 81 }, () => new Set()),
        };
    }

    if (gameState.pencilMode) {
        gameState.pencilMode = false;
        games.set(gameId, gameState);
        await SudokuGame.updateOne({ gameId }, { pencilMode: false, lastUpdated: Date.now(), messageId: gameState.messageId });
    }

    const currentPlayerId = gameState.joinedPlayers[gameState.currentTurnIndex % gameState.joinedPlayers.length];
    if (interaction.user.id !== currentPlayerId) {
        return interaction.reply({ content: `It's not your turn!`, flags: MessageFlags.Ephemeral });
    }

    gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.joinedPlayers.length;
    games.set(gameId, gameState);
    await SudokuGame.updateOne({ gameId }, { currentTurnIndex: gameState.currentTurnIndex, lastUpdated: Date.now(), messageId: gameState.messageId });

    const filledCells = gameState.puzzle.filter(n => n !== null).length;
    const totalCells = 81;
    const percent = Math.floor((filledCells / totalCells) * 100);
    const fields = getTurnEmbedFields(gameState);

    const buffer = await drawSudokuGrid(gameState.puzzle, gameState.prefilledSet, gameState.theme, null, null, null, gameState.conflictSet, gameState.notes.map(s => Array.from(s)));
    const attachment = new AttachmentBuilder(buffer, { name: 'sudoku.png' });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(td => td.setContent(`### ${gameId.startsWith('sudoku-daily-') ? 'Daily' : titleCase(gameState.theme)} Sudoku ∘ ${titleCase(gameState.difficulty)} [${percent}%]`))
        .addMediaGalleryComponents(g => g.addItems( new MediaGalleryItemBuilder().setURL(`attachment://${attachment.name}`)));

    if (gameState.mode === 'multi') {
        const turnInfo = fields.map(f => `${f.name}: ${f.value}`).join('\n');
        container.addSeparatorComponents(s => s).addTextDisplayComponents(td => td.setContent(turnInfo));
    }

    if (filledCells === totalCells) {
        const isCorrect = isPuzzleInSolutions(gameState.puzzle, gameState.allSolutions);
    if (isCorrect) {
        container.addSeparatorComponents(s => s);
        const { leveledUp, newLevel, xpGained, toastsGained, hintsGained } = await grantGameRewards(interaction.user.id, interaction.guild?.id);
        const hintText = hintsGained > 0 ? ` and ${hintsGained} Hint!` : "";

        if (leveledUp) {
            container.addTextDisplayComponents(td => td.setContent(`🎉 Congratulations, you leveled up to ${newLevel}, you gained ${toastsGained} Toasts${hintText}`));
        } else {
            container.addTextDisplayComponents(td => td.setContent(`🎉 Congratulations, you gained ${xpGained} exp, ${toastsGained} Toasts${hintText}`));
        }

        let customThemesCompleted = 0;
        const allCustomThemes = ['faces','toastie','colourblind','animals','transport'];
        if (gameState.theme && allCustomThemes.includes(gameState.theme.toLowerCase())) {
            customThemesCompleted = 1;
        }

        const options = {
            solved: true,
            daily: gameState.mode === 'daily' ? 1 : 0,
            toastEarned: toastsGained,
            expEarned: xpGained,
            hintsCollected: hintsGained,
            hintsUsed: 0,
            customThemesCompleted: customThemesCompleted,
            endedEarly: false,
            difficulty: gameState.difficulty,
            theme: gameState.theme
        };

        if (gameState.mode === 'daily') {
            await updateWeeklyQuestsFromGame(interaction.user.id, gameState, options, interaction.user);
        } else {
            await updateWeeklyQuestsFromGame(interaction.user.id, gameState, options, interaction.channel);
        }
        
        const finalBuffer = await drawSudokuGrid(gameState.puzzle, gameState.prefilledSet, gameState.theme, null, null, null, null);
        const finalAttachment = new AttachmentBuilder(finalBuffer, { name: 'sudoku.png' });

        await SudokuGame.updateOne({ gameId }, {
            puzzle: gameState.puzzle,
            prefilledSet: [...gameState.prefilledSet],
            theme: gameState.theme,
            difficulty: gameState.difficulty,
            selectedCell: null,
            selectedGrid: null,
            selectedValue: null,
            conflictSet: [...gameState.conflictSet],
            mode: gameState.mode,
            currentTurnIndex: gameState.currentTurnIndex,
            joinedPlayers: gameState.joinedPlayers,
            allSolutions: gameState.allSolutions,
            messageId: gameState.messageId
        });

        await logFinishedGame(gameState, true);
        let profileData = await Profile.findOne({ userId: interaction.user.id });
        if (!profileData) {
            profileData = new Profile({ _id: new mongoose.Types.ObjectId(), userId: interaction.user.id });
            await profileData.save();
        }

        let gamesPlayed = new BigNumber(profileData.misc.gamesPlayed || "0");
        gamesPlayed = gamesPlayed.plus(1);
        profileData.misc.gamesPlayed = gamesPlayed.toString();
        await profileData.save();
        games.delete(gameId);
        await SudokuGame.deleteOne({ gameId });

        if (gameState.mode === 'daily') {
            const today = new Date().toISOString().split('T')[0];
            await DailyCompletion.create({ userId: interaction.user.id, date: today });
        };

        return interaction.update({ components: [container], files: [finalAttachment] });
        } else {
            container.addSeparatorComponents(s => s).addTextDisplayComponents(td => td.setContent('✖️ The puzzle is not correct yet. Keep trying!'));
            const buttonRows = createGridButtons(gameState, gameState.joinedPlayers[gameState.currentTurnIndex]);
            container.addActionRowComponents(...buttonRows.filter(Boolean));
        }
    } else {
        const buttonRows = createGridButtons(gameState, gameState.joinedPlayers[gameState.currentTurnIndex]);
        container.addSeparatorComponents(s => s).addActionRowComponents(...buttonRows.filter(Boolean));
    }

    return interaction.update({ components: [container], files: [attachment] });
}
