const fetch = require('node-fetch')
const { EmbedBuilder } = require("discord.js");
const commands = require('../../index.js');
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  const categories = {
    help: [],
    osu: [],
    general: [],
    chess: [],
    fun: []
  };



  Object.entries(commands).forEach(([name, command]) => {
    categories[command.category].push(name);
  });

  if(args[0]){
    const commandName = args[0];
    if (commands[commandName]) {
        const embed = new EmbedBuilder()
        .setColor('Purple')
        .setTitle(`${prefix}${commandName}`)
        .setDescription(`${commands[commandName].description}`)
        .setFields({name: `Usage`, value: `\`${commands[commandName].usage}\``, inline: true}, {name: `Aliases`, value: `\`${commands[commandName].aliases}\``, inline: true})
        message.channel.send({embeds: [embed]})
    } else {
        message.channel.send(`**Such a command doesn't exist! see a list of all the commands using \`${prefix}help\`**`);
    }
    return;
  }


  const embed = new EmbedBuilder()
    .setColor('Purple')
    .setTitle(`Available in ${client.guilds.cache.size} servers, with ${categories.osu.length+categories.general.length+categories.fun.length+categories.help.length+categories.chess.length} commands!`)

    .addFields(
      { name: "**osu! commands**", value: categories.osu.join(', '), inline: false },
      { name: "**general commands**", value: categories.general.join(', '), inline: false },
      { name: "**fun commands**", value: categories.fun.join(', '), inline: false },
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
