const { MongoClient } = require("mongodb");
const URI = process.env.DBURI;

module.exports = {
    name: ">mine",
    description: "mine schlockcoin for user",
    execute(msg, args) {
        msg.reply("Mining...");
        async function initCheck(id) { // check if both user is initialized
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