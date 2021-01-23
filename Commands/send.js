const { MongoClient } = require("mongodb");
const URI = process.env.DBURI;
const crypto = require('crypto');

module.exports = {
    name: ">send",
    description: "Send schlockcoin to user",
    execute(msg, args) {

        async function createTransaction(senderId, receiverId, amount) {
            const client = new MongoClient(URI);

            try {
                await client.connect();
                var db = client.db("digicurr");
                var recentDoc = await db.collection("transactions").find().sort({index:-1}).limit(1).next();
                var sender = await db.collection("accounts").findOne(
                    {accountName: senderId},
                    {accountId: 1, balance: 1}
                )

                var receiver = await db.collection("accounts").findOne(
                    {accountName: receiverId},
                    {accountId: 1, balance: 1}
                )
                

                var hash = crypto.createHash("sha512");
                hash.update(JSON.stringify(recentDoc), 'utf-8');
                var finalHash = hash.digest('hex');
                var indice = recentDoc.index + 1;
                console.log(recentDoc.previousHash);

                var data = {
                    index: indice,
                    sender: sender.accountId,
                    receiver: receiver.accountId,
                    amount: amount,
                    previousHash: finalHash
                }

                db.collection("transactions").insertOne(data, function(err, res) {
                    if (err) {
                        throw err;
                    }
                });
            } catch (e) {
                console.error(e);
                msg.reply(e);
            } finally {
                await client.close();
            }

        }

        async function initCheck(id, mention) { // check if both users are initialized
            let found1 = false;
            let found2 = false;
            const client = new MongoClient(URI);
            try {
                await client.connect();

                var db = client.db("digicurr");

                if (await db.collection("accounts").countDocuments({accountName: id}) !== 0) { //check if user exists
                    found1 = true;
                }

                if (await db.collection("accounts").countDocuments({accountName: mention}) !== 0) { // check if tagged user exists
                    found2 = true;
                }

                return [found1, found2];

            } catch (e) {
                console.error(e);
                msg.reply(e);
            } finally {
                await client.close();
            }
        }

        async function sendCoins(senderId, receiverId) {
            const client = new MongoClient(URI);
            try {
                await client.connect();
                var db = client.db("digicurr");
                var amount = parseInt(args[0]);

                var sender = await db.collection("accounts").findOne(
                    {accountName: senderId},
                    {accountId: 1, balance: 1}
                )

                var receiver = await db.collection("accounts").findOne(
                    {accountName: receiverId},
                    {accountId: 1, balance: 1}
                )

                var sendFinal = parseInt(sender.balance) - amount;
                var recFinal = parseInt(receiver.balance) + amount;

                if (amount > sender.balance) {
                    msg.reply("Insufficient funds")
                } else {
                    // remove amount from sender
                    await db.collection("accounts").updateOne(
                        {   accountId: sender.accountId },
                        {
                            $set: {balance: sendFinal}
                        }
                    )

                    await db.collection("accounts").updateOne(
                        {   accountId: receiver.accountId },
                        {
                            $set: {balance: recFinal}
                        }
                    )
                    createTransaction(senderId, receiverId, amount);
                    msg.reply("Transaction successful!");
                }


            } catch (e) {
                console.error(e);
                msg.reply(e);
            } finally {
                await client.close();
            }
        }

        // do error check with initCheck results
        initCheck(msg.author.id, msg.mentions.users.first().id).then((response) => {
            errorCheck(response);
        })

        function errorCheck(response) {
            if ((args.length !== 2) || (msg.mentions.users.size !== 1)) { // check command syntax
                msg.reply("Error: Expected format '>send <amount> <tagged user>'");
            } else if (args[1] !== `<@!${msg.mentions.users.first().id}>`) {
                msg.reply("Error: Expected format '>send <amount> <tagged user>'");
            } else if (msg.author.id === msg.mentions.users.first().id) {
                msg.reply("Sending money to yourself.... sad");
            } else if (!response[0]) {
                msg.reply("Initialize account first with >init");
            } else if (!response[1]) {
                msg.reply("Tagged user must initialize account first with >init");
            } else {
                sendCoins(msg.author.id, msg.mentions.users.first().id).then((response) => {
                    console.log(response);
                });
            }
        }

        


    }
}