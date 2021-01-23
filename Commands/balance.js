const { MongoClient } = require("mongodb");
const URI = process.env.DBURI;

module.exports = {
    name: ">balance",
    description: "show user balance",
    execute(msg, args) {
        msg.reply("Checking...");
        async function checkBalance(id) {
            const client = new MongoClient(URI);
            try {
                await client.connect();
                var db = client.db("digicurr");
                var user = await db.collection("accounts").findOne(
                    {accountName: id},
                    {accountId: 1, balance: 1}
                )

                msg.reply(`Your balance is ${user.balance}`);
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
            if ((args.length > 0)) { // check command syntax
                msg.reply("Error: Expected format '>balance'");
            } else if (!response) {
                msg.reply("Initialize account first with >init");
            } else {
                checkBalance(msg.author.id).then((response) => {
                    console.log(response);
                });
            }
        }


    }
}