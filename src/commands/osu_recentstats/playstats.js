const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
const { EmbedBuilder } = require("discord.js")

// importing GetRecent
const { PlayStats } = require("../../utils/exports/playstats_export.js")
const { FindUserargs } = require("../../utils/exports/finduserargs_export.js")

module.exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		var server = "bancho"

		let mode = "osu"
		let RuleSetId = 0

		if (args.includes("-mania")) {
			mode = "mania"
			RuleSetId = 3
		}
		if (args.includes("-taiko")) {
			mode = "taiko"
			RuleSetId = 1
		}
		if (args.includes("-ctb")) {
			mode = "fruits"
			RuleSetId = 2
		}

		if (args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-taiko")) {
			userargs = userData[message.author.id].BanchoUserId
		}

		var userargs = await FindUserargs(message, args, server, prefix)

		if (userargs.length === 0) {
			try {
				userargs = userData[message.author.id].BanchoUserId
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
			}
		}

		//log in
		await auth.login(process.env.client_id, process.env.client_secret)
		const user = await v2.user.details(userargs, mode)
		if (user.id === undefined) {
			message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist**`)] })
			return
		}

		message.channel.send({ embeds: [await PlayStats(user, RuleSetId, mode)] })
	})
}
exports.name = ["playstats"]
exports.aliases = ["playstats", "playstats", "ps", "pstat"]
exports.description = ["Displays user's osu!standard stats based on a collection of recent plays. The user can type `?recent` to add to the collection of plays.\n\n**Parameters:**\n`username`"]
exports.usage = [`ps YoruNoKen`]
exports.category = ["osu"]
