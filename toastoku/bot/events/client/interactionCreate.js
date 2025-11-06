const { Events } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');
const Warden = require('dis-warden');;
const fl = require('fluident');

const menuHandlers = require("../menus");
const buttonHandlers = require("../buttons");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, bot) {
    const logger = new Warden('https://discord.com/api/webhooks/1413901413364531311/5SIYnU5GYsR-34BqXoN_aOmv2zutu-YB9EjJWnX7JKjdZAk6xOfxQMXTKFELaA_v4Axo');
    logger.setupGlobalHandlers();

    try {     
      // --- AUTOCOMPLETE HANDLER ---
      if (interaction.isAutocomplete()) {
        const command = bot.guildCommands?.get(interaction.commandName) ?? bot.globalCommands?.get(interaction.commandName);
        if (!command?.autocomplete) return;

        try {
          await command.autocomplete(interaction);
        } catch (err) {
          console.error(`[AUTOCOMPLETE ERROR] ${interaction.commandName}:`, err);
        }
        return;
      }

      // --- SLASH COMMAND HANDLER ---
      if (interaction.isChatInputCommand()) {
        const command = bot.guildCommands?.get(interaction.commandName) ?? bot.globalCommands?.get(interaction.commandName);
        if (!command) {
          console.log(`No slash command found for ${interaction.commandName}`);
          return;
        }
        await command.execute(interaction, bot);
        return;
      }

      // --- SELECT MENUS ---
      if (interaction.isStringSelectMenu()) {
        for (const handler of menuHandlers) {
          await handler(interaction);
        }
      }

      //  --- BUTTONS ---      
      if (interaction.isButton()) {
        for (const handler of buttonHandlers) {
          await handler(interaction);
        }
      }
    } catch (err) {
      console.error(fl.red(`[INTERACTION ERROR] ${interaction.commandName || 'unknown'}:`), err);

      if (
        interaction.isRepliable?.() &&
        !interaction.replied &&
        !interaction.deferred
      ) {
        try {
          await interaction.reply({
            content: "There was an error while executing this interaction!",
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          console.error(fl.red("Failed to reply to interaction error:"), e);
        }
      } else if (interaction.isRepliable?.()) {
        try {
          await interaction.followUp({
            content: "There was an error while executing this interaction!",
            flags: MessageFlags.Ephemeral,
          });
        } catch (e) {
          console.error(fl.red("Failed to follow up after interaction error:"), e);
        }
      }

      logger.logError(err);
    }
  },
};
