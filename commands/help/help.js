const fetch = require('node-fetch')
const { EmbedBuilder } = require("discord.js");
const commands = require('../../index.js');
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  const categories = {
    help: [],
    osu: [],
    general: [],
    chess: []
  };



  Object.entries(commands).forEach(([name, command]) => {
    categories[command.category].push(name);
  });

  const response = await fetch('https://official-joke-api.appspot.com/random_joke');
  const joke = await response.json();

  const embed = new EmbedBuilder()
    .setColor('Purple')
    .setTitle(`Available in ${client.guilds.cache.size} servers!`)
    //.setDescription(`${joke.setup}\n${joke.punchline}`)
    .addFields(
      { name: "**general commands**", value: categories.general.join(', '), inline: false },
      { name: "**osu! commands**", value: categories.osu.join(', '), inline: false },
      { name: "**chess commands**", value: categories.chess.join(', '), inline: false },
      { name: "**help commands**", value: categories.help.join(', '), inline: false },
    )
    .setThumbnail(message.author.displayAvatarURL())
    .setFooter({ text: `for more information on a command, do: ${prefix}search {commandname}` });
  message.channel.send({ embeds: [embed] });

};
exports.name = "help";
exports.aliases = ["help"]
exports.description = ["Displays a list of all the commands"]
exports.usage = ["help"]
exports.category = ["help"]
