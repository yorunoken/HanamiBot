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
		let ModeOsu = "fruits"
		let string = args.join(" ").match(/"(.*?)"/)
		ModeID = 2

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

		if (args.join(" ").startsWith("-i") || args.join(" ").startsWith("mods") || args.join(" ").startsWith("+") || args.join(" ").startsWith("-g") || args.join(" ").startsWith("-am") || args.join(" ").startsWith("-amount") || args.join(" ").startsWith("-rev") || args.join(" ").startsWith("-reverse")) {
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

		message.channel.send({ embeds: [await GetUserTop(user, pageNumber, ModeOsu, ModeID, args, argValues["mods"], play_number)] })
	})
}
exports.name = ["ctbtop"]
exports.aliases = ["ctbtop", "ctop", "topc", "topctb"]
exports.description = ["Displays user's Catch the Beat top plays\n\n**Parameters:**\n`username` get the top plays of a user (must be first parameter) \n`-i (number)` get a specific play (1-100)\n`-p` get a specific page (1-20)"]
exports.usage = [`ctbtop YesMyDarkness -i 16\nctbtop YesMyDarkness -p 8`]
exports.category = ["osu"]
