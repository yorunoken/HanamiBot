const fs = require("fs")
const { EmbedBuilder } = require("discord.js")
const { v2, auth } = require("osu-api-extended")
const axios = require("axios")

// importing top
const { GetUserTop } = require("../../utils/exports/top_export.js")
const { FindUserargs } = require("../../utils/exports/finduserargs_export.js")

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		let PageNumber = 1
		let play_number = undefined
		let ModeOsu = "taiko"
		let RulesetId = 1
		let RB = true

		let argValues = {}
		for (const arg of args) {
			const [key, value] = arg.split("=")
			argValues[key] = value
		}

		try {
			server = userData[message.author.id].server || "bancho"
		} catch (err) {
			server = "bancho"
		}

		if (args.includes("-bancho")) server = "bancho"
		if (args.includes("-gatari")) server = "gatari"

		var userargs = await FindUserargs(message, args, server, prefix)

		if (args.includes("-i")) {
			const iIndex = args.indexOf("-i")
			play_number = args[iIndex + 1]
		} else if (args.includes("-p")) {
			PageNumber = args[args.indexOf("-p") + 1]
		} else {
			PageNumber = 1
		}

		if (PageNumber > 20) {
			message.reply(`**Value must not be greater than 20**`)
			return
		}
		if (play_number > 100) {
			message.reply(`**Value must not be greater than 100**`)
			return
		}

		if (args.join(" ").startsWith("-i") || args.join(" ").startsWith("mods") || args.join(" ").startsWith("+") || args.join(" ").startsWith("-rev") || args.join(" ").startsWith("-reverse")) {
			try {
				if (server == "bancho") userargs = userData[message.author.id].BanchoUserId
				if (server == "gatari") userargs = userData[message.author.id].GatariUserId
			} catch (err) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Set your osu! username by typing "${prefix}link **your username**"`)] })
			}
		}

		let user
		let userstats
		if (server == "bancho") {
			//log in
			await auth.login(process.env.client_id, process.env.client_secret)
			user = await v2.user.details(userargs, ModeOsu)
			if (user.id === undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in Bancho database**`)] })
				return
			}
		}

		if (server == "gatari") {
			var Userurl = `https://api.gatari.pw/users/get?u=`
			var UserStatsurl = `https://api.gatari.pw/user/stats?u=`

			const userResponse = await axios.get(`${Userurl}${userargs}`)
			const userStatsResponse = await axios.get(`${UserStatsurl}${userargs}&${RulesetId}`)

			user = userResponse.data.users[0]
			userstats = userStatsResponse.data.stats

			if (user == undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in Gatari database**`)] })
				return
			}
		}

		message.channel.send({ embeds: [await GetUserTop(user, userstats, PageNumber, ModeOsu, RulesetId, args, argValues["mods"], play_number, RB, server)] })
	})
}
exports.name = ["recenttaikobest"]
exports.aliases = ["recenttaikobest", "rtb", "rstb"]
exports.description = ["Displays user's most recent top 100 osu!standard play\n\n**Parameters:**\n`-i (number)` get the latest play by number (1-100)\n`-l` get a list of recent best plays\n`-p (number)` specify the page of the list"]
exports.usage = [`rb {username}`]
exports.category = ["osu"]
