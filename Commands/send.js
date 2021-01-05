const { MongoClient } = require("mongodb");
const URI = process.env.DBURI;

module.exports = {
    name: ">send",
    description: "Send schlockcoin to user",
    execute(msg, args) {

        const client = new MongoClient(URI);

        async function initCheck(id, mention) { // check if both users are initialized
            let found1 = false;
            let found2 = false;
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
            } else{
                msg.reply("success");
            }
        }

        


    }
}