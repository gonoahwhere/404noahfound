const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');
const { Api } = require("@top-gg/sdk"); // For manual posting instead of AutoPoster

module.exports = {
  data: new SlashCommandBuilder()
    .setName("topgg")
    .setDescription("Post stats to topgg."),
  async execute(interaction, bot) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (interaction.user.id !== "372456601266683914") {
      return interaction.editReply({ content: "You do not have permission to use this command!", flags: MessageFlags.Ephemeral });
    }

    const api = new Api(process.env.TOPGG_TOKEN);

    try {
      await api.postStats({
        serverCount: bot.guilds.cache.size
      });

      await interaction.editReply({ content: `Posted stats to top.gg!`, flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `An error has occurred!`, flags: MessageFlags.Ephemeral });
    }
  }
};
