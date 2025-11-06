/*
=========================================================

                SUDOKU BOT MANAGEMENT
        "All code below is for your sudoku bot."
             
=========================================================
*/

require('events').defaultMaxListeners = 150;
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fl = require("fluident");
const clientHandler = require("./handlers/index.js");
require('dotenv').config();

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildMessageReactions
    ],
});

bot.globalCommands = new Collection();
bot.guildCommands = new Collection();
bot.events = new Collection();
bot.config = require("./config");
bot.cwd = require("process").cwd();
bot.mongoose = require("./utils/mongoose");

clientHandler.loadGlobalCommands(bot);
clientHandler.loadGuildCommands(bot);
clientHandler.loadClientEvents(bot);

process.on("uncaughtException", (err) => {
    console.error(fl.red("[UNCAUGHT EXCEPTION]:"), err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error(fl.red("[UNHANDLED REJECTION]:"));
    console.error(fl.red('Promise:'), promise);
    console.error(fl.red('Reason:'), reason);
});

bot.mongoose.init();
bot.login(process.env.DISCORD_BOT_TOKEN);
