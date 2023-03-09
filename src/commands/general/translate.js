const { translate } = require("@vitalets/google-translate-api")
const { EmbedBuilder } = require("discord.js")

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	let TranslateTo = "en"
	const Text = args.join(" ")

	const res = await translate(Text, { to: TranslateTo }).catch(err => {
		message.channel.send(`${err}`)
		return
	})

	const embed = new EmbedBuilder()
		.setTitle(`Translated from ${res.raw.src.toUpperCase()} to ${TranslateTo.toUpperCase()}`)
		.setColor("Purple")
		// .setThumbnail(`${message.author.displayAvatarURL()}?size=1024`)
		.setDescription(`raw:\n> ${Text}\n\ntranslated:\n> ${res.text}`)
		.setFooter({ text: `Requested by ${message.author.username}` })

	message.channel.send({ embeds: [embed] })
}
exports.name = "translate"
exports.aliases = ["translate"]
exports.description = ["Translates your text to English!"]
exports.usage = [`translate naber dostum ne yapıyorsun`]
exports.category = ["general"]
