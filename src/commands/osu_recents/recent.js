const fs = require("fs")
const { v2, auth } = require("osu-api-extended")

// importing GetRecent
const { GetRecent } = require("../../exports/recent_export")

module.exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
		} else {
			const userData = JSON.parse(data)
			let userargs
			let value = 0

			let mode = "osu"

			let RuleSetId = 0
			let PassDetermine = 1

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
					if (args.includes("-i")) {
						const iIndex = args.indexOf("-i")
						value = args[iIndex + 1] - 1
					} else {
						value = 0
					}

					if (args.includes("-osu")) {
						mode = "osu"
						RuleSetId = 0
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
					if (args.includes("-pass")) {
						PassDetermine = 0
					}

					if (args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-taiko") || args.join(" ").startsWith("-osu") || args.join(" ").startsWith("-i") || args.join(" ").startsWith("-pass") || args.join(" ").startsWith("mods") || args.join(" ").startsWith("+")) {
						try {
							userargs = userData[message.author.id].osuUsername
						} catch (err) {
							message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
						}
					}
				}
			}

			if (userargs.length === 0) {
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

			const Recent = await GetRecent(value, user, mode, PassDetermine, args, RuleSetId)
			try {
				console.log(Recent.FilterMods)
			} catch (err) {
				message.reply(`**No recent plays for \`${user.username}\`**`)
				return
			}

			message.channel.send({ content: Recent.FilterMods, embeds: [Recent.embed.data] })
		}
	})
}
exports.name = ["recent"]
exports.aliases = ["recent", "r", "rs"]
exports.description = ["Displays user's recent osu!standard play\n\n**Parameters:**\n`username` get the recent play of a user (must be first parameter) \n`-i (int)` get a specific play (1-100)\n`-pass` get the latest passed play (no parameters)\n`mods=(string)` get the latest play by mods"]
exports.usage = [`recent YoruNoKen\nrs Whitecat -i 4\nrs -pass -i 3\nrecent mods=dt -pass`]
exports.category = ["osu"]
