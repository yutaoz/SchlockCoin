const { MongoClient } = require("mongodb");
const URI = process.env.DBURI;

module.exports = {
    name: ">send",
    description: "Send schlockcoin to user",
    execute(msg, args) {

        var initCheckResult;

        const client = new MongoClient(URI);

        async function initCheck(id) {
            let found = false;
            try {
                await client.connect();

                var db = client.db("digicurr");

                if (await db.collection("accounts").countDocuments({accountName: id}) !== 0) { //check if user exists
                    found = true;
                }

                return found;

            } catch (e) {
                console.error(e);
                msg.reply(e);
            } finally {
                await client.close();
            }
        }

        initCheck(msg.author.id).then((response) => {
            initCheckResult = response;
        })

        function errorCheck(response) {
            if ((args.length !== 2) || (msg.mentions.users.size !== 1)) { // check command syntax
                msg.reply("Error: Expected format '>send <amount> <tagged user>'");
            } else if (!initCheckResult) {
                console.log(initCheckResult);
                msg.reply("Initialize account first with >init");
            } else if (typeof args[0] === 'number') {
                msg.reply("3");
            } else{
                msg.reply("success");
            }
        }

        


    }
}