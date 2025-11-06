const { SlashCommandBuilder, ContainerBuilder, MediaGalleryItemBuilder, SeparatorBuilder, AttachmentBuilder } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');
const SudokuGame = require("../../../models/sudokuGame");
const { drawSudokuGrid, getConflictingCells, createGridButtons, createCellButtons, getTurnEmbedFields } = require("../../commands/global/sudoku");
const { games } = require("../../../utils/games.js");
const ServerSettings = require("../../../models/serverSettings.js");
const Profile = require('../../../models/userProfile');
const BigNumber = require("bignumber.js");
const { updateWeeklyQuestsFromGame } = require("../../../utils/updateQuests");
const { getWeeklyQuests } = require("../../../utils/questTracker.js");
const WeeklyQuestProgress = require('../../../models/weeklyQuests');

function titleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hint")
    .setDescription("Fill a hint in your current Sudoku game."),

  async execute(interaction, bot) {
    const serverSettings = await ServerSettings.findOne({ guildId: interaction.guildId });
    if (!serverSettings || !serverSettings.hintsEnabled) {
      return interaction.reply({
        content: "Hints are disabled on this server! Ask a manager to enable them.",
        flags: MessageFlags.Ephemeral
      });
    }

    // --- Check profile hints ---
    const profileData = await Profile.findOne({ userId: interaction.user.id });
    if (!profileData) {
      return interaction.reply({
        content: "You don’t have a profile yet!",
        flags: MessageFlags.Ephemeral
      });
    }

    const dailyHints = new BigNumber(profileData.misc.dailyHints || "0");
    const regularHints = new BigNumber(profileData.misc.hints || "0");

    let hintType;
    if (dailyHints.gt(0)) {
      hintType = "dailyHints";
    } else if (regularHints.gt(0)) {
      hintType = "hints";
    } else {
      return interaction.reply({
        content: "You don't have any hints available.",
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      // --- Load game ---
      let gameId, gameDoc, gameState;

      const multiplayerGame = await SudokuGame.findOne({ gameId: { $regex: `^sudoku-${interaction.channelId}-` } });
      if (multiplayerGame && (multiplayerGame.hostId === interaction.user.id || multiplayerGame.joinedPlayers.includes(interaction.user.id))) {
        gameId = multiplayerGame.gameId;
        gameDoc = multiplayerGame;
      } else {
        const singleGame = await SudokuGame.findOne({ hostId: interaction.user.id, mode: "single" });
        if (singleGame) {
          gameId = singleGame.gameId;
          gameDoc = singleGame;
        }
      }

      if (!gameId || !gameDoc) {
        return interaction.reply({ content: "You don’t have an active Sudoku game!", flags: MessageFlags.Ephemeral });
      }

      // --- Get or initialize game state ---
      gameState = games.get(gameId);
      if (!gameState) {
        gameState = {
          ...gameDoc.toObject(),
          prefilledSet: new Set(gameDoc.prefilledSet),
          conflictSet: new Set(gameDoc.conflictSet),
          notes: gameDoc.notes ? gameDoc.notes.map(arr => new Set(arr)) : Array.from({ length: 81 }, () => new Set()),
          channelId: gameDoc.channelId || interaction.channel.id
        };
      }

      // --- Multiplayer turn check ---
      if (gameState.mode === "multi") {
        const currentPlayerId = gameState.joinedPlayers[gameState.currentTurnIndex % gameState.joinedPlayers.length];
        if (interaction.user.id !== currentPlayerId) {
          return interaction.reply({ content: "It’s not your turn!", flags: MessageFlags.Ephemeral });
        }
      }

      // --- Reset grid if user is no longer in a grid ---
      if (gameState.selectedGrid === null) {
        gameState.selectedGrid = null;
        await SudokuGame.updateOne({ gameId }, { selectedGrid: null });
      }

      const userInGrid = gameState.selectedGrid !== null;

      // --- Select a cell to fill ---
      let cellIndex;
      if (gameState.selectedCell !== null) {
        cellIndex = gameState.selectedCell;
      } else {
        let fillableCells = [];

        if (userInGrid) {
          const startRow = Math.floor(gameState.selectedGrid / 3) * 3;
          const startCol = (gameState.selectedGrid % 3) * 3;
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const idx = (startRow + r) * 9 + (startCol + c);
              if (!gameState.prefilledSet.has(idx) && gameState.puzzle[idx] == null) fillableCells.push(idx);
            }
          }
        }

        if (fillableCells.length === 0) {
          fillableCells = gameState.puzzle
            .map((v, i) => (!gameState.prefilledSet.has(i) && v == null ? i : -1))
            .filter(i => i !== -1);
          if (fillableCells.length === 0) return; // fully filled
        }

        cellIndex = fillableCells[Math.floor(Math.random() * fillableCells.length)];
      }

      const hintValue = gameState.originalPuzzle[cellIndex];
      gameState.puzzle[cellIndex] = hintValue;
      gameState.prefilledSet.add(cellIndex);
      gameState.conflictSet = getConflictingCells(gameState.puzzle);
      gameState.selectedCell = (gameState.selectedCell !== null) ? cellIndex : null;

      // --- Deduct hint ---
      if (hintType === "dailyHints") {
        profileData.misc.dailyHints = dailyHints.minus(1).toString();
      } else {
        profileData.misc.hints = regularHints.minus(1).toString();
      }
      await profileData.save();

      const options = {
        solved: false,
        daily: gameState.mode === 'daily' ? 1 : 0,
        toastEarned: 0,
        expEarned: 0,
        hintsCollected: 0,
        hintsUsed: 1,
        customThemesCompleted: 0,
        endedEarly: false
      };
      
      if (gameState.mode === 'daily') {
        await updateWeeklyQuestsFromGame(interaction.user.id, gameState, options, interaction.user);
      } else {
        await updateWeeklyQuestsFromGame(interaction.user.id, gameState, options, interaction.channel);
      }

      // --- DRAW: highlight only if user is actively in a grid ---
      const buffer = await drawSudokuGrid(
        gameState.puzzle,
        gameState.prefilledSet,
        gameState.theme,
        gameState.selectedCell,
        { index: cellIndex, value: hintValue },
        userInGrid ? gameState.selectedGrid : null,
        gameState.conflictSet,
        gameState.notes.map(s => Array.from(s))
      );

      // --- BUTTONS ---
      let buttonRows;
      if (userInGrid) {
        buttonRows = createCellButtons(
          gameState.theme,
          new Set(gameState.prefilledSet),
          gameState.puzzle,
          gameState.selectedGrid,
          gameState.mode,
          gameState.joinedPlayers
        );
      } else {
        const currentPlayerId = gameState.mode === "multi"
          ? gameState.joinedPlayers[gameState.currentTurnIndex % gameState.joinedPlayers.length]
          : interaction.user.id;
        buttonRows = createGridButtons(gameState, currentPlayerId);
      }

      const attachment = new AttachmentBuilder(buffer, { name: "sudoku.png" });

      // --- Container ---
      const fields = getTurnEmbedFields(gameState);
      const percent = Math.floor(gameState.puzzle.filter(n => n !== null).length / 81 * 100);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(td => td.setContent(`### ${gameId.startsWith('sudoku-daily-') ? 'Daily' : titleCase(gameState.theme)} Sudoku ∘ ${titleCase(gameState.difficulty)} [${percent}%]`))
        .addMediaGalleryComponents(g => g.addItems(new MediaGalleryItemBuilder().setDescription("Sudoku board").setURL(`attachment://${attachment.name}`)))
        .addSeparatorComponents(s => s)
        .addActionRowComponents(...buttonRows.filter(Boolean));

      if (gameState.mode === "multi") {
        const turnInfo = fields.map(f => `${f.name}: ${f.value}`).join("\n");
        container.addTextDisplayComponents(td => td.setContent(turnInfo));
      }

      // --- Send/edit message ---
      const channel = await bot.channels.fetch(gameState.channelId).catch(() => null);
      if (!channel) return;

      if (!gameState.messageId) {
        const sent = await channel.send({ components: [container], files: [attachment] });
        gameState.messageId = sent.id;
      } else {
        const lastMsg = await channel.messages.fetch(gameState.messageId).catch(() => null);
        if (lastMsg && lastMsg.author.id === bot.user.id) {
          await lastMsg.edit({ components: [container], files: [attachment] });
        } else {
          const sent = await channel.send({ components: [container], files: [attachment] });
          gameState.messageId = sent.id;
        }
      }

      // --- Save state ---
      games.set(gameId, gameState);
      await SudokuGame.updateOne({ gameId }, {
        puzzle: gameState.puzzle,
        prefilledSet: [...gameState.prefilledSet],
        conflictSet: [...gameState.conflictSet],
        selectedCell: gameState.selectedCell,
        selectedGrid: gameState.selectedGrid,
        lastUpdated: Date.now()
      });

      return interaction.reply({ content: "A hint has been filled in!", flags: MessageFlags.Ephemeral });

    } catch (err) {
      console.error(err);
      return interaction.reply({ content: "Something went wrong while generating a hint.", flags: MessageFlags.Ephemeral });
    }
  }
};
