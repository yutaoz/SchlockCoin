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
    bot.user.setActivity("Start with >init");
});

async function checkMuted(id) { // check if user is muted to delete messages
    const client = new MongoClient(URI);
    let muted = true;
    try {
        await client.connect();
        var db = client.db("digicurr");

        if (await db.collection("muted").countDocuments({accountName: id}) === 0) {
            muted = false;
        } else {
            var user = await db.collection("muted").findOne(
                {accountName: id},
                {muteTime: 1}
            )
            var currentTime = new Date;
            const minute = 1000 * 60;
            if (currentTime - user.muteTime > 2 * minute) {
                await db.collection("muted").deleteOne({accountName: id}, function(err, obj) {
                    if (err) throw err;
                    console.log("Delete successful");
                });
                muted = false;
            } else {
                muted = true;
            }
        }
        return muted;
    } catch (e) {
        console.error(e);
        msg.reply(e);
    } finally {
        await client.close();
    }
}

bot.on('message', msg => {

    checkMuted(msg.author.id).then((response) => {
        if (response) {
            msg.delete();
        } else {
            const args = msg.content.split(/ +/);
        const command = args.shift().toLowerCase();

        if (!bot.commands.has(command)) return;

        try {
            bot.commands.get(command).execute(msg, args);
        } catch (error) {
            console.error(error);
            msg.reply('there was an error. go cry or smth');
        }

        }
    })
    
});