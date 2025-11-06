const { SlashCommandBuilder, ContainerBuilder } = require('discord.js');
const { MessageFlags } = require('discord-api-types/v10');
const questItems = require("../../jsons/quests.json");
const WeeklyQuestProgress = require('../../../models/weeklyQuests');
const crypto = require("crypto");

function getWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDays = Math.floor((now - startOfYear) / 86400000);
  return Math.ceil((pastDays - startOfYear.getDay() + 1) / 7);
}

function getWeeklyQuests() {
  const week = getWeekNumber();
  const seed = crypto.createHash("md5").update(String(week)).digest("hex");
  let rngIndex = 0;

  function seededRandom() {
    const x = Math.sin(parseInt(seed.slice(rngIndex, rngIndex + 8), 16)) * 10000;
    rngIndex = (rngIndex + 8) % seed.length;
    return x - Math.floor(x);
  }

  const shuffled = [...questItems].sort(() => 0.5 - seededRandom());
  return shuffled.slice(0, 3);
}

// FIXED getProgressBar: always safe numbers
function getProgressBar(current, total, length = 10) {
  current = Math.max(0, Number(current) || 0); // never negative or NaN
  total = Math.max(1, Number(total) || 1);     // never zero or NaN

  const filledLength = Math.min(length, Math.round((current / total) * length));
  const emptyLength = length - filledLength;

  return '■'.repeat(filledLength) + '□'.repeat(emptyLength) + ` ${current}/${total}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weekly-quests')
    .setDescription('View this week\'s quests!'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const emojiReply = '<:replyagain:1425263957672853586>';
    const emojiReplyLast = '<:reply:1425263948155981874>';

    const weeklyQuests = getWeeklyQuests();
    const weekNumber = getWeekNumber();

    // Load or initialize user data
    let userData = await WeeklyQuestProgress.findOne({ userId });
    if (!userData || userData.week !== weekNumber) {
      const questMap = {};
      weeklyQuests.forEach(q => questMap[q.itemId] = 0);
      if (weeklyQuests.some(q => q.itemId === 'quests.custom5')) questMap['custom5Themes'] = [];
      userData = new WeeklyQuestProgress({
        userId,
        week: weekNumber,
        quests: questMap
      });
      await userData.save();
    }

    // Build quest display
    const questDisplay = weeklyQuests.map(q => {
      let progress = userData.quests[q.itemId];

      // Handle array progress (custom themes)
      if (Array.isArray(progress)) progress = progress.length;
      else progress = Number(progress ?? 0);

      progress = Math.max(0, progress); // clamp negative

      // Completion marker only
      const isComplete = !!userData.quests[`${q.itemId}_claimed`];

      const statusEmoji = isComplete ? '<:approve:1425263885241417838>' : '<:deny:1425263897044189216>';

      // Safe total
      const total = Math.max(1, q.total ?? 1);

      return `${statusEmoji} \`${q.name}\`\n-# ${emojiReply}${q.description}\n-# ${emojiReply}${q.reward}\n-# ${emojiReplyLast}${getProgressBar(progress, total, 10)}`;
    }).join('\n\n');

    const container = new ContainerBuilder()
      .addTextDisplayComponents(td => td.setContent(`### 🔥 Fresh Outta the Toaster Quests`))
      .addSeparatorComponents(s => s)
      .addTextDisplayComponents(td => td.setContent(`${questDisplay}`));

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
