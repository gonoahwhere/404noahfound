const { ContainerBuilder, MediaGalleryItemBuilder, AttachmentBuilder } = require("discord.js");
const { titleCase, getTurnEmbedFields, createCellButtons, createNumberButtons, getConflictingCells, drawSudokuGrid, isPuzzleInSolutions } = require('../../commands/global/sudoku');
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

/**
 * ✅ Ensures notes are always valid Sets, even if DB data was corrupted.
 */
function sanitizeNotes(notes) {
    if (!Array.isArray(notes)) return Array.from({ length: 81 }, () => new Set());
    return notes.map(n => {
        if (n instanceof Set) return n;
        if (Array.isArray(n)) return new Set(n);
        return new Set();
    });
}

module.exports = async function handleNum(interaction) {
    if (!interaction.customId.startsWith('num_')) return;

    const today = new Date().toISOString().split('T')[0];
    let gameId;

    let game = await SudokuGame.findOne({
        gameId: { $regex: `^sudoku-${interaction.channelId}-` },
        $or: [{ hostId: interaction.user.id }, { joinedPlayers: interaction.user.id }]
    });

    if (!game) {
        game = await SudokuGame.findOne({
            gameId: { $regex: `^sudoku-daily-${today}-` },
            hostId: interaction.user.id
        });
    }

    if (!game) {
        return interaction.reply({
            content: 'No active Sudoku game found!',
            flags: MessageFlags.Ephemeral
        });
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
            notes: sanitizeNotes(savedGame.notes),
        };
    }

    const currentPlayerId = gameState.mode === 'multi'
        ? gameState.joinedPlayers[gameState.currentTurnIndex % gameState.joinedPlayers.length]
        : interaction.user.id;

    if (interaction.user.id !== currentPlayerId) {
        return interaction.reply({ content: "It's not your turn!", flags: MessageFlags.Ephemeral });
    }

    const selectedCell = gameState.selectedCell;
    if (selectedCell === null)
        return interaction.reply({ content: 'No cell selected!', flags: MessageFlags.Ephemeral });

    const num = parseInt(interaction.customId.split('_')[1]);
    if (isNaN(num) || num < 1 || num > 9) return;

    if (!gameState.notes[selectedCell])
        gameState.notes[selectedCell] = new Set();

    if (gameState.pencilMode) {
        const cellNotes = gameState.notes[selectedCell];
        if (cellNotes.has(num)) cellNotes.delete(num);
        else cellNotes.add(num);
    } else {
        const zeroBasedNum = num - 1;
        gameState.puzzle[selectedCell] = zeroBasedNum;
        gameState.selectedValue = zeroBasedNum;
        gameState.notes[selectedCell] = new Set();

        const row = Math.floor(selectedCell / 9);
        const col = selectedCell % 9;
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;

        for (let i = 0; i < 9; i++) {
            const rowIdx = row * 9 + i;
            if (gameState.notes[rowIdx]) gameState.notes[rowIdx].delete(num);

            const colIdx = i * 9 + col;
            if (gameState.notes[colIdx]) gameState.notes[colIdx].delete(num);
        }

        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                const idx = r * 9 + c;
                if (gameState.notes[idx]) gameState.notes[idx].delete(num);
            }
        }

        gameState.conflictSet = getConflictingCells(gameState.puzzle);
        gameState.selectedCell = null;
    }

    gameState.notes = sanitizeNotes(gameState.notes);
    games.set(gameId, gameState);

    await SudokuGame.updateOne(
        { gameId },
        {
            puzzle: gameState.puzzle,
            selectedCell: gameState.selectedCell,
            selectedValue: gameState.selectedValue,
            conflictSet: [...gameState.conflictSet],
            notes: gameState.notes.map(s => Array.from(s)),
            pencilMode: gameState.pencilMode,
            lastUpdated: Date.now(),
            messageId: gameState.messageId
        }
    );

    const filledCells = gameState.puzzle.filter(n => n !== null).length;
    const percent = Math.floor((filledCells / 81) * 100);
    const fields = getTurnEmbedFields(gameState);
    const buffer = await drawSudokuGrid(gameState.puzzle, gameState.prefilledSet, gameState.theme, selectedCell, gameState.pencilMode ? null : gameState.selectedValue, gameState.selectedGrid, gameState.conflictSet, gameState.notes.map(s => Array.from(s)));
    const attachment = new AttachmentBuilder(buffer, { name: 'sudoku.png' });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(td =>
            td.setContent(
                `### ${gameId.startsWith('sudoku-daily-') ? 'Daily' : titleCase(gameState.theme)} Sudoku ∘ ${titleCase(gameState.difficulty)} [${percent}%]`
            )
        )
        .addMediaGalleryComponents(g =>
            g.addItems(new MediaGalleryItemBuilder().setURL(`attachment://${attachment.name}`))
        );

    if (gameState.mode === 'multi') {
        const turnInfo = fields.map(f => `${f.name}: ${f.value}`).join('\n');
        container
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(td => td.setContent(turnInfo));
    }

    if (filledCells === 81) {
        const isCorrect = isPuzzleInSolutions(gameState.puzzle, gameState.allSolutions);
        if (isCorrect) {
            container.addSeparatorComponents(s => s);
            const { leveledUp, newLevel, xpGained, toastsGained, hintsGained } =
                await grantGameRewards(interaction.user.id, interaction.guild?.id);
            const hintText = hintsGained > 0 ? ` and ${hintsGained} Hint!` : "";

            if (leveledUp) {
                container.addTextDisplayComponents(td =>
                    td.setContent(`🎉 Congratulations, you leveled up to ${newLevel}, you gained ${toastsGained} Toasts${hintText}`)
                );
            } else {
                container.addTextDisplayComponents(td =>
                    td.setContent(`🎉 Congratulations, you gained ${xpGained} exp, ${toastsGained} Toasts${hintText}`)
                );
            }

            let customThemesCompleted = 0;
            const allCustomThemes = ['faces', 'toastie', 'colourblind', 'animals', 'transport'];
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
                customThemesCompleted,
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
            }

            return interaction.update({ components: [container], files: [finalAttachment] });
        } else {
            container.addSeparatorComponents(s => s);
            container.addTextDisplayComponents(td =>
                td.setContent('✖️ The puzzle is not correct yet. Keep trying!')
            );
        }
    }

    const buttonRows =
        gameState.selectedCell !== null
            ? createNumberButtons(gameState.theme, gameState.prefilledSet, gameState.puzzle, gameState.selectedCell, gameState.mode, gameState.pencilMode, gameState.joinedPlayers)
            : createCellButtons(gameState.theme, gameState.prefilledSet, gameState.puzzle, gameState.selectedGrid, gameState.mode, gameState.joinedPlayers);

    container
        .addSeparatorComponents(s => s)
        .addActionRowComponents(...buttonRows.filter(Boolean));

    return interaction.update({ components: [container], files: [attachment] });
};
