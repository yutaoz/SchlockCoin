// initialization
require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const botCommands = require('./Commands/core');
const {MongoClient} = require('mongodb');
const crypto = require('crypto');
const TOKEN = process.env.TOKEN;
const URI = process.env.DBURI;

Object.keys(botCommands).map(key => {
    bot.commands.set(botCommands[key].name, botCommands[key]);
});

bot.login(TOKEN);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}`)
});

bot.on('message', msg => {
    const args = msg.content.split(/ +/);
    const command = args.shift().toLowerCase();

    if (!bot.commands.has(command)) return;

    try {
        bot.commands.get(command).execute(msg, args);
    } catch (error) {
        console.error(error);
        msg.reply('there was an error. go cry or smth');
    }
});