const { SlashCommandBuilder, ContainerBuilder, MediaGalleryItemBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ActionRowBuilder } = require('discord.js');
const { MessageFlags } = require('discord-api-types/v10');
const sudoku = require('sudoku');
const path = require('path');
const Canvas = require('canvas');
const fs = require('fs');
const { games } = require('../../../utils/games.js');
const mongoose = require('mongoose');
const SudokuGame = require('../../../models/sudokuGame');

Canvas.registerFont(
  path.join(__dirname, '..', '..', 'fonts', 'Sniglet-Regular.ttf'),
  { family: 'Sniglet' }
);

const emojiThemes = {
  default: {
    buttons: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    canvas: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  },
  toastie: {
    buttons: [
      { name: 'toastie1', id: '1384614836432015420' },
      { name: 'toastie2', id: '1384614838143025222' },
      { name: 'toastie3', id: '1384614840185655467' },
      { name: 'toastie4', id: '1384614841481953421' },
      { name: 'toastie5', id: '1384614843046301696' },
      { name: 'toastie6', id: '1384614844279427132' },
      { name: 'toastie7', id: '1384614846137368759' },
      { name: 'toastie8', id: '1384614847588601999' },
      { name: 'toastie9', id: '1384614849752862790' },
    ],
    canvas: ['toastie1', 'toastie2', 'toastie3', 'toastie4', 'toastie5', 'toastie6', 'toastie7', 'toastie8', 'toastie9'],
  },
  colorblind: {
    buttons: [
      { name: 'cb1', id: '1384614887283622068' },
      { name: 'cb2', id: '1384614888457900195' },
      { name: 'cb3', id: '1384614890903310458' },
      { name: 'cb4', id: '1384614892241162413' },
      { name: 'cb5', id: '1384614893704974427' },
      { name: 'cb6', id: '1384614895223308461' },
      { name: 'cb7', id: '1384614896657891409' },
      { name: 'cb8', id: '1384614902911471636' },
      { name: 'cb9', id: '1384614904463364247' },
    ],
    canvas: ['cb1', 'cb2', 'cb3', 'cb4', 'cb5', 'cb6', 'cb7', 'cb8', 'cb9'],
  },
  faces: {
    buttons: [
      { name: 'f1', id: '1384616172078759996' },
      { name: 'f2', id: '1384616173580320878' },
      { name: 'f3', id: '1384616175161573548' },
      { name: 'f4', id: '1384616177032233060' },
      { name: 'f5', id: '1384616178726735992' },
      { name: 'f6', id: '1384616180547059803' },
      { name: 'f7', id: '1384616183126429847' },
      { name: 'f8', id: '1384616185123049744' },
      { name: 'f9', id: '1384616186645319692' },
    ],
    canvas: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9'],
  },
  transport: {
    buttons: [
      { name: 't1', id: '1384615921204592843' },
      { name: 't2', id: '1384615923176050808' },
      { name: 't3', id: '1384615925235580998' },
      { name: 't4', id: '1384615927391457330' },
      { name: 't5', id: '1384615928813060148' },
      { name: 't6', id: '1384615931682099232' },
      { name: 't7', id: '1384615933217341581' },
      { name: 't8', id: '1384615935159308339' },
      { name: 't9', id: '1384615936962728067' },
    ],
    canvas: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'],
  },
  animals: {
    buttons: [
      { name: 'a1', id: '1384619444759826682' },
      { name: 'a2', id: '1384619446273839154' },
      { name: 'a3', id: '1384619447599497317' },
      { name: 'a4', id: '1384619449239212186' },
      { name: 'a5', id: '1384619450707349584' },
      { name: 'a6', id: '1384619452028551218' },
      { name: 'a7', id: '1384619453429579886' },
      { name: 'a8', id: '1384619454809505832' },
      { name: 'a9', id: '1384619456919109874' },
    ],
    canvas: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9'],
  }
};

const difficulties = {
  'very easy': [45, 50],
  'easy': [40, 44],
  'medium': [34, 39],
  'hard': [28, 33],
  'very hard': [22, 27],
  'expert': [17, 21],
};

function titleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function wrapRows(rows) {
  // Wrap plain arrays of buttons in ActionRowBuilder and filter empty rows
  return rows
    .filter(r => r && r.length > 0)
    .map(r => {
      const row = new ActionRowBuilder();
      row.addComponents(...r.slice(0, 5)); // Discord max 5 buttons per row
      return row;
    });
}

function createGridButtons(gameState, userId) {
  const rows = [];

  // --- 3x3 grid selection buttons ---
  for (let row = 0; row < 3; row++) {
    const rowButtons = [];
    for (let col = 0; col < 3; col++) {
      const gridNum = row * 3 + col + 1;
      rowButtons.push(
        new ButtonBuilder()
          .setCustomId(`grid_${gridNum}`)
          .setLabel(`${gridNum}`)
          .setStyle(ButtonStyle.Primary)
      );
    }
    rows.push(rowButtons);
  }

  // --- Control row ---
  const currentPlayerId = gameState.joinedPlayers[gameState.currentTurnIndex];
  const isCurrentPlayer = userId === currentPlayerId;
  const controlButtons = [];

  if (gameState.mode === 'multi' && isCurrentPlayer && gameState.joinedPlayers.length > 1) {
    controlButtons.push(
      new ButtonBuilder()
        .setCustomId('end_turn')
        .setLabel('End Your Turn')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  if (gameState.mode === 'single' || gameState.mode === 'daily') {
    controlButtons.push(
      new ButtonBuilder()
        .setCustomId('end_game')
        .setLabel('End Game')
        .setStyle(ButtonStyle.Danger)
    );
  }

  if (controlButtons.length) rows.push(controlButtons);

  // --- Extra row for multiplayer leave/end ---
  if (gameState.mode === 'multi') {
    const extraButtons = [];
    if (gameState.joinedPlayers.length > 1) {
      extraButtons.push(
        new ButtonBuilder()
          .setCustomId('leave_game')
          .setLabel('Leave Game')
          .setStyle(ButtonStyle.Danger)
      );
    } else {
      extraButtons.push(
        new ButtonBuilder()
          .setCustomId('end_game')
          .setLabel('End Game')
          .setStyle(ButtonStyle.Danger)
      );
    }
    if (extraButtons.length) rows.push(extraButtons);
  }

  return wrapRows(rows);
}

function createLobbyButtons(gameState, userId) {
  const rows = [];
  const rowButtons = [];
  const maxPlayers = 4;
  const isHost = gameState.hostId === gameState.joinedPlayers[0];
  const isFull = gameState.joinedPlayers.length >= maxPlayers;

  if (gameState.mode === 'multi' && !isFull) {
    rowButtons.push(
      new ButtonBuilder()
        .setCustomId('join_game')
        .setLabel('Join Game')
        .setStyle(ButtonStyle.Success)
    );
  }

  if (gameState.mode === 'multi' && gameState.joinedPlayers.length >= 2 && isHost) {
    rowButtons.push(
      new ButtonBuilder()
        .setCustomId('start_game')
        .setLabel('Start Game')
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (gameState.joinedPlayers.length > 1 && gameState.joinedPlayers.includes(userId)) {
    rowButtons.push(
      new ButtonBuilder()
        .setCustomId('leave_game_lobby')
        .setLabel('Leave Game')
        .setStyle(ButtonStyle.Danger)
    );
  }

  if (gameState.joinedPlayers.length >= 1 && gameState.joinedPlayers.includes(userId) && isHost) {
    rowButtons.push(
      new ButtonBuilder()
        .setCustomId('end_game_lobby')
        .setLabel('End Game')
        .setStyle(ButtonStyle.Danger)
    );
  }

  if (rowButtons.length) rows.push(rowButtons);
  return wrapRows(rows);
}

function getTurnEmbedFields(gameState) {
  if (gameState.mode === 'multi') {
    const players = gameState.joinedPlayers;
    const mention = id => `<@${id}>`;
    const current = players[gameState.currentTurnIndex % players.length];
    const next = players[(gameState.currentTurnIndex + 1) % players.length];
    const all = players.map(mention).join(', ');

    return [
      { name: 'Current Player', value: mention(current), inline: true },
      { name: 'Next Player', value: mention(next), inline: true },
      { name: 'All Players', value: all, inline: false },
    ];
  }
  return [];
}

function createCellButtons(theme, prefilledSet, puzzle, selectedGrid, mode, joinedPlayers) {
  const rows = [];
  const themeData = emojiThemes[theme] || emojiThemes['default'];
  const startRow = Math.floor(selectedGrid / 3) * 3;
  const startCol = (selectedGrid % 3) * 3;

  // --- 3x3 Sudoku grid buttons ---
  for (let row = 0; row < 3; row++) {
    const rowButtons = [];
    for (let col = 0; col < 3; col++) {
      const globalRow = startRow + row;
      const globalCol = startCol + col;
      const index = globalRow * 9 + globalCol;
      const value = puzzle[index];
      const isPrefilled = prefilledSet.has(index);

      let labelOrEmoji;
      if (Array.isArray(themeData.buttons) &&
          value !== null &&
          themeData.buttons[value] &&
          typeof themeData.buttons[value] === 'object' &&
          themeData.buttons[value].id) {
        labelOrEmoji = { id: themeData.buttons[value].id };
      } else if (value !== null) {
        labelOrEmoji = themeData.buttons[value] || `${value + 1}`;
      } else {
        labelOrEmoji = '•';
      }

      const btn = new ButtonBuilder()
        .setCustomId(`cell_${index}`)
        .setDisabled(isPrefilled)
        .setStyle(isPrefilled ? ButtonStyle.Secondary : ButtonStyle.Primary);

      if (typeof labelOrEmoji === 'object') btn.setEmoji(labelOrEmoji);
      else btn.setLabel(labelOrEmoji);

      rowButtons.push(btn);
    }
    rows.push(rowButtons);
  }

  // --- Control row ---
  const controlButtons = [];
  if ((mode === 'multi' && joinedPlayers.length > 1) || mode === 'single' || mode === 'daily') {
    controlButtons.push(
      new ButtonBuilder()
        .setCustomId('back_to_grid')
        .setLabel('Back to Grid')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  if (controlButtons.length) rows.push(controlButtons);

  return wrapRows(rows);
}

function createNumberButtons(theme, prefilledSet, puzzle, selectedCell, mode, pencilMode, joinedPlayers) {
  const rows = [];
  const themeData = emojiThemes[theme] || emojiThemes['default'];

  // --- Number buttons ---
  for (let row = 0; row < 3; row++) {
    const rowButtons = [];
    for (let col = 0; col < 3; col++) {
      const num = row * 3 + col + 1;
      const btn = new ButtonBuilder()
        .setCustomId(`num_${num}`)
        .setStyle(selectedCell !== null && puzzle[selectedCell] === num ? ButtonStyle.Primary : ButtonStyle.Secondary);

      const themeButton = themeData.buttons?.[num - 1];
      if (themeButton && typeof themeButton === 'object' && themeButton.id) btn.setEmoji({ id: themeButton.id });
      else btn.setLabel(themeButton || `${num}`);

      rowButtons.push(btn);
    }
    rows.push(rowButtons);
  }

  // --- Control row ---
  const controlButtons = [
    new ButtonBuilder()
      .setCustomId('back_to_cell')
      .setLabel('Back to Cells')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('pencil_mode')
      .setLabel('Pencil Mode')
      .setStyle(pencilMode ? ButtonStyle.Success : ButtonStyle.Secondary),
  ];
  rows.push(controlButtons);

  return wrapRows(rows);
}










function getConflictingCells(puzzle) {
  const conflicts = new Set();

  for (let i = 0; i < 81; i++) {
    const val = puzzle[i];
    if (val === null) continue;

    const row = Math.floor(i / 9);
    const col = i % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    for (let j = 0; j < 81; j++) {
      if (i === j || puzzle[j] === null) continue;
      if (puzzle[j] !== val) continue;

      const otherRow = Math.floor(j / 9);
      const otherCol = j % 9;

      const sameRow = otherRow === row;
      const sameCol = otherCol === col;
      const sameBox =
        Math.floor(otherRow / 3) === boxRow &&
        Math.floor(otherCol / 3) === boxCol;

      if (sameRow || sameCol || sameBox) {
        conflicts.add(i);
        conflicts.add(j);
      }
    }
  }

  return conflicts;
}

function applyCompletionUI(container, gameState) {
  const filledCells = gameState.puzzle.filter(n => n !== null).length;
  const totalCells = 81;
  const isComplete = filledCells === totalCells;

  if (isComplete) {
    const isCorrect = isPuzzleInSolutions(gameState.puzzle, gameState.allSolutions);
    if (isCorrect) {
      container.addTextDisplayComponents(td =>
        td.setContent('🎉 Congratulations! You solved the puzzle!')
      );
      return { complete: true, correct: true };
    } else {
      container.addTextDisplayComponents(td =>
        td.setContent('✖️ The puzzle is not correct yet. Keep trying!')
      );
      return { complete: true, correct: false };
    }
  }

  return { complete: false, correct: false };
}

async function drawSudokuGrid(puzzle, prefilledSet, theme, selectedCell, selectedValue, selectedGrid, conflictSet = new Set(),  notes = []) {
  const cellSize = 60;
  const size = 540;
  const canvas = Canvas.createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#91939F';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#A8AAB7';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 9; i++) {
    const pos = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();
  }

  ctx.strokeStyle = '#DADCE3';
  ctx.lineWidth = 5;
  for (let i = 0; i <= 3; i++) {
    const pos = i * cellSize * 3;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();
  }

  if (selectedGrid != null) {
    const startRow = Math.floor(selectedGrid / 3) * 3;
    const startCol = (selectedGrid % 3) * 3;
    ctx.fillStyle = 'rgba(87, 114, 212, 0.15)';
    ctx.fillRect(startCol * cellSize, startRow * cellSize, cellSize * 3, cellSize * 3);
  }

  if (conflictSet && conflictSet.size > 0) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    for (const idx of conflictSet) {
      const row = Math.floor(idx / 9);
      const col = idx % 9;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  if (selectedCell != null) {
    const row = Math.floor(selectedCell / 9);
    const col = selectedCell % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    ctx.fillStyle = 'rgba(87, 114, 212, 0.1)';
    ctx.fillRect(0, row * cellSize, size, cellSize);
    ctx.fillRect(col * cellSize, 0, cellSize, size);
    ctx.fillRect(boxCol * cellSize * 3, boxRow * cellSize * 3, cellSize * 3, cellSize * 3);

    ctx.fillStyle = 'rgba(87, 114, 212, 0.3)';
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
  }

  notes = notes.map(n => (n instanceof Set ? n : new Set(n)));

  if (theme === 'default') {
    ctx.fillStyle = '#0E0f12';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 81; i++) {
      const val = puzzle[i];
      const col = i % 9;
      const row = Math.floor(i / 9);

      if (val != null) {
        ctx.font = 'bold 30px Sniglet';
        ctx.fillStyle = prefilledSet.has(i) ? '#000' : '#0E0f12';
        ctx.fillText((val + 1).toString(), col * cellSize + cellSize / 2, row * cellSize + cellSize / 2);
      } else if (notes[i] && notes[i].size > 0) {
        ctx.font = '18px Sniglet';
        ctx.fillStyle = '#0E0f12';
        Array.from(notes[i])
          .sort((a, b) => a - b)
          .forEach(n => {
            const subRow = Math.floor((n - 1) / 3);
            const subCol = (n - 1) % 3;
            const x = col * cellSize + subCol * (cellSize / 3) + (cellSize / 6);
            const y = row * cellSize + subRow * (cellSize / 3) + (cellSize / 6);
            ctx.fillText(n.toString(), x, y);
          });
      }
    }
  } else {
    const themeLower = theme.toLowerCase();
    const emojiDir = path.join(__dirname, `../../assets/emoji-sets/${themeLower}`);
    const emojiImages = {};
    const prefixes = { toastie: 'toastie', faces: 'f', animals: 'a', transport: 't', colorblind: 'cb' };
    const prefix = prefixes[themeLower];

    for (let i = 1; i <= 9; i++) {
      const emojiPath = path.join(emojiDir, `${prefix}${i}.png`);
      if (fs.existsSync(emojiPath)) emojiImages[i] = await Canvas.loadImage(emojiPath);
    }

    for (let i = 0; i < 81; i++) {
      const val = puzzle[i];
      const col = i % 9;
      const row = Math.floor(i / 9);
      const x = col * cellSize;
      const y = row * cellSize;

      if (val != null && emojiImages[val + 1]) {
        const padding = 10;
        ctx.drawImage(emojiImages[val + 1], x + padding, y + padding, cellSize - 2 * padding, cellSize - 2 * padding);
      } else if (notes[i] && notes[i].size > 0) {
        const miniSize = cellSize / 3 - 4;
        Array.from(notes[i])
          .sort((a, b) => a - b)
          .forEach(n => {
            const subRow = Math.floor((n - 1) / 3);
            const subCol = (n - 1) % 3;
            const nx = x + subCol * (cellSize / 3) + 2;
            const ny = y + subRow * (cellSize / 3) + 2;
            if (emojiImages[n]) ctx.drawImage(emojiImages[n], nx, ny, miniSize, miniSize);
          });
      }
    }
  }

  return canvas.toBuffer();
}

function isValidPlacement(grid, index, val) {
  const row = Math.floor(index / 9);
  const col = index % 9;

  for (let c = 0; c < 9; c++) {
    if (grid[row * 9 + c] === val && col !== c) return false;
  }

  for (let r = 0; r < 9; r++) {
    if (grid[r * 9 + col] === val && r !== row) return false;
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = (boxRow + r) * 9 + (boxCol + c);
      if (grid[cell] === val && cell !== index) return false;
    }
  }

  return true;
}

function findAllSolutions(grid, solutions = [], index = 0, maxSolutions = 50, startTime = Date.now(), maxTime = 30000) {
  if (solutions.length >= maxSolutions || (Date.now() - startTime) > maxTime) return;

  while (index < 81 && grid[index] !== null && grid[index] !== undefined) {
    index++;
  }

  if (index === 81) {
    solutions.push([...grid]);
    return;
  }

  for (let val = 0; val < 9; val++) {
    if (isValidPlacement(grid, index, val)) {
      grid[index] = val;
      findAllSolutions(grid, solutions, index + 1, maxSolutions, startTime, maxTime);
      grid[index] = null;

      if (solutions.length >= maxSolutions || (Date.now() - startTime) > maxTime) return;
    }
  }
}

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

function isPuzzleInSolutions(puzzle, solutions) {
  return solutions.some(solution => arraysEqual(puzzle, solution));
}

const difficultyChoices = Object.keys(difficulties).map(key => ({
  name: titleCase(key),
  value: key
}));

const themeChoices = Object.keys(emojiThemes).map(key => ({
  name: titleCase(key),
  value: key
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sudoku')
    .setDescription('Play Sudoku')
    .addSubcommand(subcmd =>
      subcmd
        .setName('play')
        .setDescription('Play a new Sudoku game')
        .addStringOption(opt =>
          opt
            .setName('difficulty')
            .setDescription('Select difficulty')
            .setRequired(true)
            .addChoices(...difficultyChoices)
        )
        .addStringOption(opt =>
          opt
            .setName('theme')
            .setDescription('Select emoji theme')
            .setRequired(true)
            .addChoices(...themeChoices)
        )
        .addStringOption(opt =>
          opt
            .setName('mode')
            .setDescription('Game mode')
            .setRequired(true)
            .addChoices(
              { name: 'Singleplayer', value: 'single' },
              { name: 'Multiplayer', value: 'multi' },
            )
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'play') {
      const difficulty = interaction.options.getString('difficulty') || 'easy';
      const theme = interaction.options.getString('theme') || 'default';
      const mode = interaction.options.getString('mode') || 'single';
      const guildId = interaction.guildId;

      const activeGames = await SudokuGame.countDocuments({
        guildId,
        mode
      });

      let gameLimit = 25;

      const supportServerId = "1412083896300077140";
      if (guildId === supportServerId) {
        gameLimit = 125;
      }

      if (activeGames >= gameLimit) {
        return interaction.reply({
          content: `❌ This server already has ${gameLimit} active **${titleCase(mode)}player** Sudoku games.\nPlease wait until a **${titleCase(mode)}player** game ends.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const [minPrefilled, maxPrefilled] = difficulties[difficulty] || difficulties['easy'];
      const targetPrefilled = Math.floor(Math.random() * (maxPrefilled - minPrefilled + 1)) + minPrefilled;

      let solution = sudoku.makepuzzle();
      let solved = sudoku.solvepuzzle(solution).map(n => (n !== null ? n : null));

      let puzzle = Array(81).fill(null);
      const indices = Array.from({ length: 81 }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (let i = 0; i < targetPrefilled; i++) {
        puzzle[indices[i]] = solved[indices[i]];
      }

      const prefilledSet = new Set(puzzle.map((v, i) => (v !== null ? i : -1)).filter(i => i !== -1));
      const conflictSet = getConflictingCells(puzzle);

      const puzzleCopy = [...puzzle];
      const allSolutions = [];
      findAllSolutions(puzzleCopy, allSolutions, 0, 25, Date.now(), 30000);
      if (!allSolutions.length) {
        return interaction.reply({
          content: 'Could not generate a valid puzzle for this difficulty. Try again.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const gameState = {
        puzzle,
        originalPuzzle: solved,
        prefilledSet,
        theme,
        difficulty,
        mode,
        hostId: interaction.user.id,
        selectedCell: null,
        selectedValue: null,
        selectedGrid: null,
        conflictSet,
        allSolutions,
        joinedPlayers: mode === 'multi' ? [interaction.user.id] : [],
        currentTurnIndex: 0,
        started: false,
        pencilMode: false,
        notes: Array.from({ length: 81 }, () => new Set()),
      };

      const gameId = `sudoku-${interaction.channelId || 'user'}-${interaction.user.id}`;
      const existing = await SudokuGame.findOne({ gameId });
      if (existing) {
        return interaction.reply({
          content: 'You already have a saved Sudoku game. Finish it before starting a new one.',
          flags: MessageFlags.Ephemeral,
        });
      }

      games.set(gameId, gameState);

      const filledCells = gameState.puzzle.filter(n => n !== null).length;
      const percent = Math.floor((filledCells / 81) * 100);

      const buffer = await drawSudokuGrid( gameState.puzzle, gameState.prefilledSet, gameState.theme, gameState.selectedCell, gameState.selectedValue, gameState.selectedGrid, gameState.conflictSet, gameState.notes);
      const attachmentName = 'sudoku.png';
      const attachment = new AttachmentBuilder(buffer, { name: attachmentName });

      const buttonRows = (mode === 'multi' && !gameState.started)
        ? createLobbyButtons(gameState, interaction.user.id)
        : createGridButtons(gameState, interaction.user.id);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(td =>
          td.setContent(`### ${titleCase(gameState.theme)} Sudoku ∘ ${titleCase(gameState.difficulty)} [${percent}%]`)
        )
        .addMediaGalleryComponents(g => g.addItems(
          new MediaGalleryItemBuilder()
            .setURL(`attachment://${attachmentName}`)
        ))
        .addSeparatorComponents(s => s)
        .addActionRowComponents(...buttonRows.filter(Boolean));

      await interaction.reply({ components: [container], files: [attachment], flags: MessageFlags.IsComponentsV2 });
      const sentMessage = await interaction.fetchReply();

      gameState.messageId = sentMessage.id;
      games.set(gameId, gameState);


      const sudokuData = new SudokuGame({
        _id: new mongoose.Types.ObjectId(),
        gameId,
        puzzle,
        originalPuzzle: solved,
        prefilledSet: Array.from(prefilledSet),
        theme,
        difficulty,
        mode,
        hostId: interaction.user.id,
        joinedPlayers: mode === 'multi' ? [interaction.user.id] : [],
        currentTurnIndex: 0,
        selectedCell: null,
        selectedValue: null,
        selectedGrid: null,
        started: false,
        conflictSet: Array.from(conflictSet),
        allSolutions,
        pencilMode: false,
        notes: gameState.notes.map(s => Array.from(s)),
        lastUpdated: new Date(),
        messageId: gameState.messageId,
        channelId: interaction.channelId,
        guildId: guildId
      });

      await sudokuData.save();
    }

  },

  titleCase,
  createGridButtons,
  createLobbyButtons,
  getTurnEmbedFields,
  createCellButtons,
  createNumberButtons,
  getConflictingCells,
  applyCompletionUI,
  drawSudokuGrid,
  isValidPlacement,
  findAllSolutions,
  arraysEqual,
  isPuzzleInSolutions
};
