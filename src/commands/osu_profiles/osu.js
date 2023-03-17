const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
const axios = require("axios")
const { EmbedBuilder } = require("discord.js")

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
		let mode = "osu"
		let rulesetId = 0
		let server = "bancho"
		try {
			server = userData[message.author.id].server
		} catch (err) {}

		if (args.includes("-bancho")) server = "bancho"
		if (args.includes("-gatari")) server = "gatari"
		if (args.includes("-akatsuki")) server = "akatsuki"

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

		console.log(server)

		var userargs = await FindUserargs(message, args, server, prefix)
		if (args[0] == "-akatsuki" || args[0] == "-bancho" || args[0] == "-gatari" || args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-taiko") || args.join(" ").startsWith("-osu") || args.join(" ").startsWith("-d") || args.join(" ").startsWith("-details")) {
			try {
				if (server == "bancho") userargs = userData[message.author.id].BanchoUserId
				if (server == "gatari") userargs = userData[message.author.id].GatariUserId
				if (server == "akatsuki") userargs = userData[message.author.id].AkatsukiUserId
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
				return
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
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] })
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
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] })
				return
			}
		}

		if (server == "akatsuki") {
			var BaseUrl = `https://akatsuki.pw/api/v1`

			if (isNaN(userargs)) {
				try {
					var response = await axios.get(`${BaseUrl}/users/whatid?name=${userargs}`)
					userargs = response.data.id
				} catch (err) {
					message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] })
					return
				}
			}

			var response = await axios.get(`${BaseUrl}/users/full?id=${userargs}`)
			user = response.data

			if (user.code != 200) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] })
				return
			}
		}

		if (args.join(" ").includes("-d") || args.join(" ").includes("-details")) firstPage = false

		message.channel.send({ embeds: [await GetUserPage(firstPage, user, userstats, mode, rulesetId, server)] })
	})
}
exports.name = "osu"
exports.aliases = ["osu", "o"]
exports.description = ["Displays the stats of a user\n\n**Parameters:**\n`username` get the stats from a username\n`-(gamemode)` get the stats of a particular gamemode"]
exports.usage = [`osu JustinNF -taiko\nosu YoruNoKen -taiko\nosu mrekk`]
exports.category = ["osu"]
