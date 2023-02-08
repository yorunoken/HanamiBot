const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const { v2, auth } = require("osu-api-extended");
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  fs.readFile("./user-data.json", async (error, data) => {
    if (error) {
      console.log(error);
    } else {
      const userData = JSON.parse(data);
      if (message.mentions.users.size > 0) {
        const mentionedUser = message.mentions.users.first();
        try {
          if (message.content.includes(`<@${mentionedUser.id}>`)) {
            userargs = userData[mentionedUser.id].osuUsername;
          }

        } catch (err) {
          console.error(err);
          if (mentionedUser) {
            if (message.content.includes(`<@${mentionedUser.id}>`)) {
              try {
                userData[mentionedUser.id].osuUsername;
              } catch (err) {
                message.reply(`No osu! user found for ${mentionedUser.tag}`);
              }
            } else {
              try {
                userData[message.author.id].osuUsername;
              } catch (err) {
                message.reply(
                  `Set your osu! username by using "${prefix}osuset **your username**"`
                );
              }
            }
          }
          return;
        }
      }

      if (args[0] === undefined) {
        try{
          userargs = userData[message.author.id].osuUsername;
        }catch(err){
          message.reply(
            `Set your osu! username by using "${prefix}osuset **your username**"`
          )
          return
        }
      } else {
        let string = args.join(" ").match(/"(.*?)"/)
        if (string) {
          userargs = string[1]
        } else {
          userargs = args[0]
        }
      }
      //log into api
      await auth.login(process.env.client_id, process.env.client_secret);
      const user = await v2.user.details(userargs, "osu");

      try {
        if (user.id == undefined) throw new Error("The user doesn't exist")
      } catch (err) {
        message.reply(`**The user, \`${userargs}\`, doesn't exist**`)
        return
      }

      try {
        //set country code to lowercase
        let countrycode = user.country_code.toLowerCase();

        //if the user is found. display the avatar
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `Profile Avatar of ${user.username}`,
            iconURL: `https://flagcdn.com/h80/${countrycode}.png`,
            url: `https://osu.ppy.sh/users/${user.id}`,
          })
          .setImage(`https://a.ppy.sh/${user.id}?1668890819.jpeg`);
        message.channel.send({ embeds: [embed] });
      } catch (err) {
        console.error(err);
        message.channel.send(`the user **${userargs}** doesn't exist`);
      }
    }
  });
};
exports.name = "osuavatar";
exports.aliases = ["oa", "oavatar", "osuavatar"]
exports.description = ["Displays a user's osu! avatar**Parameters:**\n\`username\` get the avatar from a username"]
exports.usage = [`osuavatar chocomint`]
exports.category = ["osu"]
