const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
const axios = require("axios")

// imports
const { GetUserPage } = require("../../exports/osu_export.js")
const { FindUserargs } = require("../../exports/finduserargs_export.js")

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()
	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return message.reply("An error occurred while reading user data.")
		}
		const userData = JSON.parse(data)
		const mode = "osu"
		rulesetId = 0
		let server = userData[message.author.id].server

		if (args.includes("-bancho")) server = "bancho"
		if (args.includes("-gatari")) server = "gatari"

		if (args.includes("-mania")) {
			mode = "mania"
			rulesetId = 3
		}
		if (args.includes("-taiko")) {
			mode = "taiko"
			rulesetId = 1
		}
		if (args.includes("-ctb")) {
			mode = "fruits"
			rulesetId = 2
		}

		var userargs = await FindUserargs(message, args, server, prefix)

		if (args.join(" ").startsWith("-bancho") || args.join(" ").startsWith("-gatari") || args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-taiko") || args.join(" ").startsWith("-osu") || args.join(" ").startsWith("-d") || args.join(" ").startsWith("-details")) {
			try {
				if (server == "bancho") userargs = userData[message.author.id].BanchoUserId
				if (server == "gatari") userargs = userData[message.author.id].GatariUserId
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
			}
		}

		let user, userstats
		let firstPage = true

		if (server == "bancho") {
			//log into api
			await auth.login(process.env.client_id, process.env.client_secret)
			user = await v2.user.details(userargs, mode)
			userstats = ""
			if (user.id == undefined) {
				message.channel.send(`**User doesn't exist in bancho database**`)
				return
			}
		}

		if (server == "gatari") {
			var Userurl = `https://api.gatari.pw/users/get?u=`
			var UserStatsurl = `https://api.gatari.pw/user/stats?u=`

			const userResponse = await axios.get(`${Userurl}${userargs}`)
			const userStatsResponse = await axios.get(`${UserStatsurl}${userargs}&${rulesetId}`)

			user = userResponse.data.users[0]
			userstats = userStatsResponse.data.stats

			if (user == undefined) {
				message.channel.send(`**User doesn't exist in gatari database**`)
				return
			}
		}

		if (args.join(" ").includes("-d") || args.join(" ").includes("-details")) firstPage = false

		message.channel.send({ embeds: [await GetUserPage(firstPage, user, userstats, mode, rulesetId)] })
	})
}
exports.name = "osu"
exports.aliases = ["osu", "o"]
exports.description = ["Displays the stats of a user\n\n**Parameters:**\n`username` get the stats from a username\n`-(gamemode)` get the stats of a particular gamemode"]
exports.usage = [`osu JustinNF -taiko\nosu YoruNoKen -taiko\nosu mrekk`]
exports.category = ["osu"]
