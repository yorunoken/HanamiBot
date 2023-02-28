var calcBmi = require("bmi-calc")
const { EmbedBuilder: E_Builder_bmi } = require("discord.js")
exports.run = async (client, message, args, prefix, EmbedBuilder) => {
	await message.channel.sendTyping()

	let is_imperial = false
	let height = Number(args[1]) / 100
	if (args.includes("-imperial")) {
		is_imperial = true
		height = Number(args[1])
	}
	const weight = Number(args[0])

	const bmi = calcBmi(weight, height, is_imperial)

	let cat = bmi.name
	let value = bmi.value.toFixed(1)
	if (bmi.name == undefined) {
		cat = "bruh"
	}
	if (value < 8) {
		cat = "bruh"
	}

	const embed = new EmbedBuilder()
		.setColor("Purple")
		.setTitle("Your BMI values are:")
		.setDescription(`**BMI Value:** \`${value}\` \n**Category:** \`${cat}\``)
		.setFooter({ text: `BMI of ${message.author.tag}` })

	message.channel.send({ embeds: [embed] })
}
exports.name = "bmi"
exports.aliases = ["bmi"]
exports.description = ["calculates a bmi value. Format is weight, then height.\n\n**Parameters:**\n`-imperial` changes values from metric to imperial"]
exports.usage = [`bmi 62 172\nbmi 154 72 -imperial`]
exports.category = ["general"]
