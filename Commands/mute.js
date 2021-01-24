const { MongoClient } = require("mongodb");
const URI = process.env.DBURI;

module.exports = {
    name: ">mute",
    description: "purchases a mute on a user",
    execute(msg, args) {

        async function buyMute(id, muted) { // mute functoin
            const client = new MongoClient(URI);
            try {
                await client.connect();
                var db = client.db("digicurr");

                var muter = await db.collection("accounts").findOne(
                    {accountName: id},
                    {accountId: 1, balance: 1}
                );

                if (muter.balance < 20) {
                    msg.reply("Insufficient Funds, mute costs 20 coins. >balance to check balance");
                } else {
                    await db.collection("accounts").updateOne( // deduct funds
                        {   accountId: muter.accountId },
                        {
                            $set: {balance: muter.balance - 20}
                        }
                    )

                    var data = { // set mute document
                        accountName: muted,
                        muteTime: new Date
                    }

                    db.collection("muted").insertOne(data, function(err, res) {
                        if (err) {
                            throw err;
                        } else {
                            msg.reply("Purchased mute for 20 SchlockCoins. User muted for 2 mins");
                        }
                    });
                }
            } catch (e) {
                console.error(e);
                msg.reply(e);
            } finally {
                await client.close();
            }
        }

        async function initCheck(id) { // check if user is initialized
            let found1 = false;
            const client = new MongoClient(URI);
            try {
                await client.connect();

                var db = client.db("digicurr");

                if (await db.collection("accounts").countDocuments({accountName: id}) !== 0) { //check if user exists
                    found1 = true;
                }

                return found1;

            } catch (e) {
                console.error(e);
                msg.reply(e);
            } finally {
                await client.close();
            }
        }

        // do error check with initCheck results
        initCheck(msg.author.id).then((response) => {
            errorCheck(response);
        })

        function errorCheck(response) {
            if ((args.length !== 1) || (msg.mentions.users.size !== 1)) { // check command syntax
                msg.reply("Error: Expected format '>send <amount> <tagged user>'");
            } else if (args[0] !== `<@!${msg.mentions.users.first().id}>`) {
                msg.reply("Error: Expected format '>send <amount> <tagged user>'");
            } else if (msg.author.id === msg.mentions.users.first().id) {
                msg.reply("cant mute urself weirdo");
            } else if (!response) {
                msg.reply("Initialize account first with >init");
            } else {
                buyMute(msg.author.id, msg.mentions.users.first().id).then((response) => {
                    console.log(response);
                });
            }
        }

    }
}