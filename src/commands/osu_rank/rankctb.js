const axios = require("axios")
const { EmbedBuilder } = require("discord.js")
require("dotenv/config")
const endpoint = `https://osudaily.net/api/`
const apiKey = process.env.osudaily_api
const fs = require("fs")
const { isNegative } = require("mathjs")
const { v2, auth } = require("osu-api-extended")

module.exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		let userargs

		let mode = "fruits"
		let RuleSetId = 2
		let mentioneduser = false

		if (message.mentions.users.size > 0) {
			const mentionedUser = message.mentions.users.first()
			try {
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						userargs = userData[mentionedUser.id].osuUsername
						mentioneduser = true
					} else {
						userargs = userData[message.author.id].osuUsername
					}
				}
			} catch (err) {
				console.error(err)
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						try {
							userargs = userData[mentionedUser.id].osuUsername
						} catch (err) {
							message.reply(`No osu! user found for ${mentionedUser.tag}`)
						}
					} else {
						try {
							userargs = userData[message.author.id].osuUsername
						} catch (err) {
							message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
						}
					}
				}
				return
			}
		} else {
			if (args[0] === undefined) {
				try {
					userargs = userData[message.author.id].osuUsername
				} catch (err) {
					console.error(err)
					message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
					return
				}
			} else {
				let string = args.join(" ").match(/"(.*?)"/)
				if (string) {
					userargs = string[1]
				} else {
					userargs = args[0]
				}

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
					try {
						userargs = userData[message.author.id].osuUsername
					} catch (err) {
						message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
					}
				}
			}
		}

		if (userargs.length === 0 || (!isNaN(userargs) && !mentioneduser)) {
			try {
				userargs = userData[message.author.id].osuUsername
			} catch (err) {
				message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
			}
		}

		//log in
		await auth.login(process.env.client_id, process.env.client_secret)
		const user = await v2.user.details(userargs, mode)
		if (user.id === undefined) {
			message.channel.send(`**The player, \`${userargs}\` does not exist**`)
			return
		}

		try {
			global_rank = user.statistics.global_rank.toLocaleString()
			country_rank = user.statistics.country_rank.toLocaleString()
			pp = user.statistics.pp.toLocaleString()
		} catch (err) {
			global_rank = "0"
			country_rank = "0"
			pp = "0"
		}

		const ReachRank = args[args.length - 1]
		if (isNaN(ReachRank)) {
			message.channel.send({ embeds: [new EmbedBuilder().setTitle("Error!").setColor("Purple").setDescription(`**Please provide a value.**`).setFooter({ text: `Are you having issues with the formatting? remember that the username always comes first!` })] })
			return
		}

		const response = await axios.get(`${endpoint}pp.php?k=${apiKey}&m=${RuleSetId}&t=rank&v=${ReachRank}`)
		const ReponseData = response.data

		const NeededPP = ReponseData.pp - user.statistics.pp
		let description = `Currently, Rank #${ReachRank} requires approximately **${ReponseData.pp}pp**, so ${user.username} will need **${NeededPP.toFixed(2).toLocaleString()}** raw pp.`
		if (isNegative(NeededPP)) description = `Currently, Rank #${ReachRank} requires approximately **${ReponseData.pp}pp**, and ${user.username} is already above that by **${Math.abs(NeededPP).toFixed(2).toLocaleString()}pp**. They could try deranking.`

		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username} ${pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
				iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
				url: `https://osu.ppy.sh/users/${user.id}`,
			})
			.setTitle(`How much pp does ${user.username} need to reach #${ReachRank}`)
			.setThumbnail(user.avatar_url)
			.setDescription(description)

		message.channel.send({ embeds: [embed] })
	})
}
exports.name = ["rankctb"]
exports.aliases = ["rankctb", "rankc"]
exports.description = ["Learn how much pp you're missing from reaching a certain rank\n\n**Parameters:**\n`username` get the recent play of a user (must be first parameter)\n`(number)`"]
exports.usage = [`rankc YoruNoKen 9893`]
exports.category = ["osu"]
