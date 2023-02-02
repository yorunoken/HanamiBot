const {EmbedBuilder} = require("discord.js")
const commands = require('../../index.js');
exports.run = async (client, message, args, prefix) => {
    await message.channel.sendTyping()

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

}
exports.name = "search"
exports.aliases = ["search"]
exports.description = ["Searches for a command and gives you its details"]
exports.usage = [`search osu`]
exports.category = ["help"]
