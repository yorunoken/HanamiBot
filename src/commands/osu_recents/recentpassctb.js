const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
const axios = require("axios")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

// importing GetRecent
const { GetRecent } = require("../../exports/recent_export")
const { FindUserargs } = require("../../exports/finduserargs_export.js")
const { GetReplay } = require("../../exports/replay_export.js")

module.exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()
	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		let value = 0
		let mode = "fruits"
		let RuleSetId = 2
		let PassDetermine = 0
		let server = "bancho"
		try {
			server = userData[message.author.id].server
		} catch (err) {}

		if (args.includes("-bancho")) server = "bancho"
		if (args.includes("-gatari")) server = "gatari"

		if (args.includes("-i")) {
			const iIndex = args.indexOf("-i")
			value = args[iIndex + 1] - 1
		}

		var userargs = await FindUserargs(message, args, server, prefix)

		if (args.join(" ").startsWith("-gatari") || args.join(" ").startsWith("-bancho") || args.join(" ").startsWith("-i") || args.join(" ").startsWith("-pass") || args.join(" ").startsWith("-ps") || args.join(" ").startsWith("mods") || args.join(" ").startsWith("+")) {
			try {
				if (server == "bancho") userargs = userData[message.author.id].BanchoUserId
				if (server == "gatari") userargs = userData[message.author.id].GatariUserId
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
			}
		}

		let user
		let userstats

		if (server == "bancho") {
			//log in
			await auth.login(process.env.client_id, process.env.client_secret)
			user = await v2.user.details(userargs, mode)
			if (user.id === undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist**`)] })
				return
			}
		}

		if (server == "gatari") {
			var Userurl = `https://api.gatari.pw/users/get?u=`
			var UserStatsurl = `https://api.gatari.pw/user/stats?u=`

			const userResponse = await axios.get(`${Userurl}${userargs}`)
			const userStatsResponse = await axios.get(`${UserStatsurl}${userargs}&${RuleSetId}`)

			user = userResponse.data.users[0]
			userstats = userStatsResponse.data.stats

			if (user == undefined) {
				message.channel.send(`**User doesn't exist in gatari database**`)
				return
			}
		}

		const Recent = await GetRecent(value, user, mode, PassDetermine, args, RuleSetId, userstats, server)
		try {
			console.log(Recent.FilterMods)
		} catch (err) {
			message.reply(`**No recent plays for \`${user.username}\`**`)
			return
		}

		let row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("render").setDisabled().setStyle(ButtonStyle.Primary).setLabel("Render"))
		if (Recent.top1k) {
			row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("render").setStyle(ButtonStyle.Primary).setLabel("Render"))
			console.log("uuu?")
			message.channel.send({ content: Recent.FilterMods, embeds: [Recent.embed.data], components: [row] })

			const filter = m => m.user.id === message.author.id
			const collector = message.channel.createMessageComponentCollector({ filter: filter, max: 1, time: 5000 })

			collector.on("collect", async collected => {
				let collectedm = collected.message
				let user = collected.user
				let score_id = Recent.score_id

				collected.update({ content: Recent.FilterMods, embeds: [Recent.embed.data], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("render").setDisabled().setStyle(ButtonStyle.Primary).setLabel("Render"))] })
				GetReplay(message, collectedm, user, score_id, mode)
				return
			})

			collector.on("end", async m => {})
			return
		}
		message.channel.send({ content: Recent.FilterMods, embeds: [Recent.embed.data] })
	})
}
exports.name = ["recentpassctb"]
exports.aliases = ["recentpassctb", "rpctb", "rspctb", "rpc", "rspc"]
exports.description = ["Displays user's recent passed osu!ctb play\n\n**Parameters:**\n`username` get the recent play of a user (must be first parameter) \n`-i (number)` get a specific play (1-100)\n`-pass` get the latest passed play (no parameters)\n`mods=(string)` get the latest play by mods"]
exports.usage = [`rctb -pass -i 3\nrecentctb Rocma -i 5`]
exports.category = ["osu"]
