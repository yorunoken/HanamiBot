const math = require("mathjs")
exports.run = async (client, message, args, prefix, EmbedBuilder) => {
	await message.channel.sendTyping()

	let expression = args.join(" ")
	try {
		let result = math.evaluate(expression)
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setTitle(`I hate doing math so I made this command`)
			.setDescription(`**Equation:** \`${expression}\`\n**Result:** \`${result.toLocaleString()}\``)
			.setFooter({ text: `Requested by ${message.author.tag}`, iconURL: `${message.author.displayAvatarURL()}?size=1024` })
		message.channel.send({ embeds: [embed] })
	} catch (err) {
		console.log(err)
		message.reply(`${err}`)
	}
}
exports.name = "math"
exports.aliases = ["math"]
exports.description = [`calculates a math equation for you.`]
exports.usage = [`math 3*9+10\nmath cos(90)\nmath (38^2)+9!`]
exports.category = ["general"]
