const fs = require("fs");
const { v2, auth } = require("osu-api-extended");
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  let string = args.join(" ").match(/"(.*?)"/)
  if (string) {
    username = string[1]
  } else {
    username = args[0]
  }

  //log into api
  await auth.login(process.env.client_id, process.env.client_secret);
  const user = await v2.user.details(username, "osu");
  if(user.id == undefined){
    message.reply(`**The user, \`${username}\`, does not exist in the database.**`)
    return
  }
  user_id = user.id

  // Read the JSON file
  fs.readFile("./user-data.json", (error, data) => {
    if (error) {
      console.log(error);
    } else {
      try {
        //update the user's osu! username in the JSON file
        const userData = JSON.parse(data);
        userData[message.author.id] = { ...userData[message.author.id], osuUsername: user_id }
        fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
          if (error) {
            console.log(error);
          } else {
            message.reply(`Set osu! username to **${user.username}**`);
          }
        });
      } catch (err) {
        message.reply(
          `The username ${username} doesn't exist in the Bancho database.`
        );
      }
    }
  });
};
exports.name = "osuset";
exports.aliases = ["osuset", "link"]
exports.description = ["Sets a nickname as your default**Parameters:**\n\`username\` set your username to the argument"]
exports.usage = [`osuset aetrna`]
exports.category = ["osu"]
