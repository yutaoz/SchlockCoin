const { MongoClient } = require("mongodb");
const crypto = require('crypto');
const URI = process.env.DBURI;

module.exports = {
    name: ">mine",
    description: "mine schlockcoin for user",
    execute(msg, args) {
        msg.reply("Mining...");

        async function createTransaction(id, amount) {
            const client = new MongoClient(URI);

            try {
                await client.connect();
                var db = client.db("digicurr");
                var recentDoc = await db.collection("transactions").find().sort({index:-1}).limit(1).next();

                var receiver = await db.collection("accounts").findOne(
                    {accountName: id},
                    {accountId: 1, balance: 1}
                )
                

                var hash = crypto.createHash("sha512");
                hash.update(JSON.stringify(recentDoc), 'utf-8');
                var finalHash = hash.digest('hex');
                var indice = recentDoc.index + 1;
                console.log(recentDoc.previousHash);

                var data = {
                    index: indice,
                    sender: "MINE",
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

        async function mineCoins(id) { // mine coins for user with id
            const client = new MongoClient(URI);
            try {
                await client.connect();
                var db = client.db("digicurr");

                var miner = await db.collection("accounts").findOne(
                    {accountName: id},
                    {accountId: 1, balance: 1}
                )

                var sendFinal = parseInt(miner.balance) + Math.floor(Math.random() * 5 + 1);

                await db.collection("accounts").updateOne(
                    {   accountId: miner.accountId },
                    {
                        $set: {balance: sendFinal}
                    }
                )
                createTransaction(id, sendFinal - parseInt(miner.balance));
                msg.reply(`Mined ${sendFinal - parseInt(miner.balance)} coins.`);

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
            if ((args.length > 0)) { // check command syntax
                msg.reply("Error: Expected format '>mine'");
            } else if (!response) {
                msg.reply("Initialize account first with >init");
            } else {
                mineCoins(msg.author.id).then((response) => {
                    console.log(response);
                });
            }
        }


    }
}