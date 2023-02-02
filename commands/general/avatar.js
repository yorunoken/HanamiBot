exports.run = async (client, message, args, prefix, EmbedBuilder) => {
  await message.channel.sendTyping()
  
  let user = message.mentions.users.first();
  if (!user) {
    user = message.author;
  }
  const userurl = `${user.displayAvatarURL()}?size=1024`
  const embed = new EmbedBuilder()
    .setColor('Purple')
    .setAuthor({
      name: `${user.tag}'s Avatar`,
      url: userurl,
    })
    .setImage(userurl)
    .setFooter({ text: `my prefix is ${prefix}` });
  message.channel.send({ embeds: [embed] });
};
exports.name = "avatar";
exports.aliases = ["avatar", "a"];
exports.description = ["Displays the avatar of a user\`\`**Parameters:**\n\`user tag\` tag a user you want to view the avatar of"]
exports.usage = [`avatar @yoru`]
exports.category = ["general"]