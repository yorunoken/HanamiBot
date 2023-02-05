const owoify = require("owoify-js").default;
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  message.channel.send("**very soon! :)**");
  
};
exports.name = "reddit";
exports.aliases = ["reddit"]
exports.description = ["Returns a random photo from a subreddit"]
exports.usage = [`reddit komi-san`]
exports.category = ["fun"]
