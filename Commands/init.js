const { MongoClient } = require("mongodb");
const crypto = require('crypto');
const URI = process.env.DBURI;
const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

module.exports = {
    name: '>init',
    description: 'initialize user',
    execute(msg, args) {

        // function to look for user in database
        const find = async () => {
            msg.reply("Initializing user...");

            const client = new MongoClient(URI); // initialize mongo client
            let found = false;

            try {
                await client.connect(); // wait for connection to mongodb
                const db = client.db("digicurr"); // initialize digicurr database

                if (await db.collection("accounts").countDocuments({accountName: msg.author.id}) !== 0) { //check if user exists
                    found = true;
                }
                

            } catch (e) {
                console.error(e);
                msg.reply(e);
            } finally {
                await client.close();
            }

            return found;

        }

        // function to look for initializatoin
        const checkInit = (bool) => {
            if (bool) {
                msg.reply("You are already initialized in the database!");
            } else {
                initialize(msg.author.id);
            }
        }
        // function to generate user hash
        const hashGen = () => {
            var len = Math.floor(Math.random() * 5) + 15;
            var saltString = "";
            for (var i = 0; i <= len; i++ ) {
                saltString += values[Math.floor(Math.random() * 36)];
            }
            var hash = crypto.createHash("sha512");
            hash.update(saltString, 'utf-8');
            var finalHash = hash.digest('hex');
        
            return finalHash;
        }
        
        // function to initialize user
        const initialize = async (id) => {
            const client = new MongoClient(URI);

            try {
                await client.connect(); // wait for connection to mongodb
                const db = client.db("digicurr"); // initialize digicurr database

                var userHash = hashGen();
                var unique = true;
                
                //check if hash is unique
                if (await db.collection("accounts").countDocuments({accountId: userHash}) !== 0) {
                    unique = false;
                }

                if (unique) { // if hash is unique, insert data
                    var data = {
                        accountName: id,
                        accountId: userHash,
                        balance: 0,
                    }

                    db.collection("accounts").insertOne(data, function(err, res) {
                        if (err) {
                            throw err;
                        } else {
                            msg.reply("Successful initialization!");
                        }
                    });


                } else { // else try again but with new hash
                    initialize(id);
                }
                
            } catch (e) {
                console.error(e);
                msg.reply(e);
            } finally {
                await client.close();
            }
        }

        
    find().then((response) => {
        checkInit(response);
    });

    console.info(msg.author.id);
    }
}