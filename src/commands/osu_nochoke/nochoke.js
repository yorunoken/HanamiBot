const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
const { EmbedBuilder } = require("discord.js")

// importing GetRecent
const { GetuserNoChoke } = require("../../exports/nochoke_export.js")

module.exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		let userargs

		let mode = "osu"
		let RuleSetId = 0

		if (message.mentions.users.size > 0) {
			const mentionedUser = message.mentions.users.first()
			try {
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						userargs = userData[mentionedUser.id].osuUsername
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
							message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
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
					message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
					return
				}
			} else {
				let string = args.join(" ").match(/"(.*?)"/)
				if (string) {
					userargs = string[1]
				} else {
					userargs = args[0]
				}
			}
		}

		if (args.join("").startsWith("-p") || args.join("").startsWith("-page")) {
			try {
				userargs = userData[message.author.id].osuUsername
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
				return
			}
		}

		if (userargs.length === 0) {
			try {
				userargs = userData[message.author.id].osuUsername
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
			}
		}

		let pageNumber = 1
		if (args.includes("-p")) {
			const iIndex = args.indexOf("-p")
			const value = args[iIndex + 1]
			pageNumber = value
		}
		if (args.includes("-page")) {
			const iIndex = args.indexOf("-page")
			const value = args[iIndex + 1]
			pageNumber = value
		}

		//log in
		await auth.login(process.env.client_id, process.env.client_secret)
		const user = await v2.user.details(userargs, mode)
		if (user.id === undefined) {
			message.channel.send(`**The player, \`${userargs}\` does not exist**`)
			return
		}

		const plays = await v2.user.scores.category(user.id, "best", {
			mode: mode,
			limit: "100",
			offset: "0",
		})

		console.log(pageNumber)

		const WaitMesasge = await message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setTitle("Calculating...").setDescription("Please sit still while I'm calculating your plays, this may take a while if it's your first time using this command.")] })

		const Stats = await GetuserNoChoke(user, plays, RuleSetId, mode, pageNumber)
		WaitMesasge.delete()
		message.channel.send({ embeds: [Stats] })
	})
}
exports.name = ["nochoke"]
exports.aliases = ["nochoke", "nc"]
exports.description = ["Displays user's osu!standard top plays if they weren't choked.\n\n**Parameters:**\n`username`"]
exports.usage = [`stats YoruNoKen`]
exports.category = ["osu"]
