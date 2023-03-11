const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const { v2, auth, tools, mods } = require("osu-api-extended")

// importing top
const { GetUserTop } = require("../../exports/top_export.js")

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		value = 1
		play_number = undefined
		let ModeOsu = "osu"
		let string = args.join(" ").match(/"(.*?)"/)
		ModeID = 0
		let RB = false

		if (message.mentions.users.size > 0) {
			const mentionedUser = message.mentions.users.first()
			try {
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						userargs = userData[mentionedUser.id].BanchoUserId
					} else {
						userargs = userData[message.author.id].BanchoUserId
					}
				}
			} catch (err) {
				console.error(err)
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						try {
							userargs = userData[mentionedUser.id].BanchoUserId
						} catch (err) {
							message.reply(`No osu! user found for ${mentionedUser.tag}`)
						}
					} else {
						try {
							userargs = userData[message.author.id].BanchoUserId
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
					userargs = userData[message.author.id].BanchoUserId
				} catch (err) {
					console.error(err)
					message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
					return
				}
			} else {
				if (args.includes("-i")) {
					singleArgument = args.slice(0, args.indexOf("-i")).join(" ")
					const iIndex = args.indexOf("-i")
					play_number = args[iIndex + 1]
					userargs = singleArgument
				} else if (args.includes("-p")) {
					singleArgument = args.slice(0, args.indexOf("-p")).join(" ")
					const iIndex = args.indexOf("-p")
					value = args[iIndex + 1]
					userargs = singleArgument
				} else {
					singleArgument = args.join(" ")
					value = 1
					userargs = singleArgument
				}

				if (value > 20) {
					message.reply(`**Value must not be greater than 20**`)
					return
				}
				if (play_number > 100) {
					message.reply(`**Value must not be greater than 100**`)
					return
				}

				if (string) {
					userargs = string[1]
				} else {
					userargs = args[0]
				}
			}
		}

		if (args.includes("-mania")) {
			ModeID = 3
			ModeOsu = "mania"
		}

		if (args.includes("-taiko")) {
			ModeID = 1
			ModeOsu = "taiko"
		}

		if (args.includes("-ctb")) {
			ModeID = 2
			ModeOsu = "ctb"
		}

		if (args.join(" ").startsWith("-r") || args.join(" ").startsWith("-recent") || args.join(" ").startsWith("-i") || args.join(" ").startsWith("mods") || args.join(" ").startsWith("+") || args.join(" ").startsWith("-g") || args.join(" ").startsWith("-am") || args.join(" ").startsWith("-amount") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-taiko") || args.join(" ").startsWith("-rev") || args.join(" ").startsWith("-reverse")) {
			try {
				userargs = userData[message.author.id].BanchoUserId
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
				return
			}
		}

		let pageNumber = Number(value)
		if (args === undefined) {
			pageNumber = Number("1")
		}
		if (args[0] === "-p") {
			pageNumber = Number(value)
			try {
				userargs = userData[message.author.id].BanchoUserId
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
			}
		}

		let argValues = {}
		for (const arg of args) {
			const [key, value] = arg.split("=")
			argValues[key] = value
		}

		//log into api
		await auth.login(process.env.client_id, process.env.client_secret)

		const user = await v2.user.details(userargs, ModeOsu)

		if (user.id == undefined) {
			message.reply(`**The user ${userargs} does not exist.**`)
			return
		}

		if (args.join(" ").includes("-am") || args.join(" ").includes("-g")) {
			if (args.join(" ").includes("-am")) query = "-am"
			if (args.join(" ").includes("-amount")) query = "-amount"
			if (args.join(" ").includes("-g")) query = "-g"

			const iIndex = args.indexOf(query)
			const GIndex = Number(args[iIndex + 1])

			//score set
			const score = await v2.user.scores.category(user.id, "best", {
				include_fails: "0",
				mode: ModeOsu,
				limit: "100",
				offset: "0",
			})

			const Number_bigger = score.filter(x => x.pp > GIndex)

			const embed = new EmbedBuilder().setColor("Purple").setDescription(`${user.username} has **\`${Number_bigger.length}\`** plays worth more than ${GIndex.toFixed(1)}PP`)

			message.channel.send({ embeds: [embed] })

			return
		}

		if (args.join(" ").includes("-r") || args.join(" ").includes("-recent")) RB = true

		message.channel.send({ embeds: [await GetUserTop(user, pageNumber, ModeOsu, ModeID, args, argValues["mods"], play_number, RB)] })
	})
}
exports.name = ["osutop"]
exports.aliases = ["top", "osutop", "t"]
exports.description = ["Displays user's top plays\n\n**Parameters:**\n`username` get the top plays of a user (must be first parameter) \n`-i (number)` get a specific play (1-100)\n`-p (number)` get a specific page (1-20)\n`-g (number)` find out how much of a pp play you have in your top plays"]
exports.usage = [`osutop whitecat -i 7\nosutop chocomint -p 4`]
exports.category = ["osu"]
