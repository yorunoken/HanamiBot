const fs = require("fs")
const { v2, auth, tools, mods } = require("osu-api-extended")
const axios = require("axios")

// importing CompareEmbed
const { CompareEmbed } = require("../../exports/compare_export.js")

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()
	await auth.login(process.env.client_id, process.env.client_secret)

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		let userargs
		let value = undefined
		let pagenum = 1
		let RuleSetId
		server = userData[message.author.id].server || "bancho"

		if (args.includes("-bancho")) server = "bancho"
		if (args.includes("-gatari")) server = "gatari"

		let mode
		try {
			mode = userData[message.author.id].osumode
			if (mode == undefined) mode = "osu"
		} catch (err) {
			mode = "osu"
		}

		if (mode == "osu") RuleSetId = 0
		if (mode == "taiko") RuleSetId = 1
		if (mode == "fruits") RuleSetId = 2
		if (mode == "mania") RuleSetId = 3

		let ErrCount = 0

		let EmbedValue = 0
		let GoodToGo = false

		if (args.includes("-i")) {
			const iIndex = args.indexOf("-i")
			value = Number(args[iIndex + 1] - 1)
			pagenum = undefined
		} else {
			value = undefined
		}

		if (args.includes("-p")) {
			const iIndex = args.indexOf("-p")
			pagenum = Number(args[iIndex + 1])
			value = undefined
		} else {
			pagenum = 1
		}

		let string = args.join(" ").match(/"(.*?)"/)
		if (string) {
			userargs = string[1]
		} else {
			userargs = args[0]
		}
		if (message.mentions.users.size > 0) {
			const mentionedUser = Array.from(message.mentions.users.entries()).pop()[Array.from(message.mentions.users.entries()).pop().length - 1]
			try {
				if (message.content.includes(`<@${mentionedUser.id}>`)) {
					userargs = userData[mentionedUser.id].BanchoUserId
				}
			} catch (err) {
				console.error(err)
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						try {
							userData[mentionedUser.id].BanchoUserId
						} catch (err) {
							message.reply(`No osu! user found for ${mentionedUser.tag}`)
						}
					} else {
						try {
							userData[message.author.id].BanchoUserId
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
				if (args.includes("-osu")) {
					RuleSetId = 0
					mode = "osu"
				}

				if (args.includes("-mania")) {
					RuleSetId = 3
					mode = "mania"
				}

				if (args.includes("-taiko")) {
					RuleSetId = 1
					mode = "taiko"
				}

				if (args.includes("-ctb")) {
					RuleSetId = 2
					mode = "ctb"
				}

				if (args.join(" ").startsWith("-gatari") || args.join(" ").startsWith("-bancho") || args.join(" ").startsWith("-i") || args.join(" ").startsWith("-p") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-taiko") || args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-osu")) {
					try {
						if (server == "bancho") userargs = userData[message.author.id].BanchoUserId
						if (server == "gatari") userargs = userData[message.author.id].GatariUserId
					} catch (err) {
						message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Set your osu! username by typing "${prefix}link **your username**"`)] })
					}
				}
			}
		}

		if (userargs?.length === 0 || userargs === undefined) {
			try {
				userargs = userData[message.author.id].BanchoUserId
			} catch (err) {
				message.reply(`No osu! user found for ${mentionedUser.tag}`)
			}
		}

		let user
		let userstats

		if (server == "bancho") {
			//log in
			await auth.login(process.env.client_id, process.env.client_secret)
			user = await v2.user.details(userargs, mode)
			if (user.id === undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] })
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
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] })
				return
			}
		}

		async function EmbedFetch(embed) {
			try {
				const beatmapId = args[0].match(/\d+/)[0]
				console.log("file: compare.js:151 ~ EmbedFetch ~ beatmapId:", beatmapId)
				// if args doesn't start with https: try to get the beatmap id by number provided
				if (!args[0].startsWith("https:")) {
					beatmapId = args[0]
				}

				if (userargs.startsWith("https")) {
					console.log("startswith")
					userargs = userData[message.author.id].BanchoUserId

					if (args[1]) {
						userargs = args[1]
						if (string) {
							userargs = string[1]
						}
					}
				}

				try {
					const mapinfo = await v2.beatmap.diff(beatmapId)
					mode = mapinfo.mode

					// send the embed
					await EmbedFunc(mapinfo, beatmapId, user, mode, value, pagenum, server, userstats)

					if (ErrCount >= 1) {
						// message.reply(`**No Scores Found For \`${user.username}\`.**`)
						return
					}
				} catch (err) {
					console.log(err)
					throw new Error("hids")
				}
			} catch (err) {
				try {
					const embed_author = embed.url
					if (embed_author.includes("/users/")) throw new Error("Wrong embed")
					if (embed_author.includes("/u/")) throw new Error("Wrong embed")
					const beatmapId = embed_author.match(/\d+/)[0]
					console.log(`embed url beatmap id ${beatmapId}`)

					const mapinfo = await v2.beatmap.diff(beatmapId)

					if (mapinfo.id == undefined) throw new Error("No Author")
					mode = mapinfo.mode

					//send the embed
					await EmbedFunc(mapinfo, beatmapId, user, mode, value, pagenum, server, userstats)
					GoodToGo = true
				} catch (err) {
					console.log(err)

					console.log("err found, switching to author")

					try {
						const embed_author = embed.author.url
						if (embed_author.includes("/users/")) throw new Error("Wrong embed")
						if (embed_author.includes("/u/")) throw new Error("Wrong embed")
						const beatmapId = embed_author.match(/\d+/)[0]

						const mapinfo = await v2.beatmap.diff(beatmapId)

						if (mapinfo.id == undefined) throw new Error("No Author")
						mode = mapinfo.mode

						//send the embed
						await EmbedFunc(mapinfo, beatmapId, user, mode, value, pagenum, server, userstats)
						GoodToGo = true
					} catch (err) {
						console.log(err)

						console.log("err found, switching to desc")
						try {
							const regex = /\/b\/(\d+)/
							const match = regex.exec(embed.description)
							const beatmapId = match[1]

							const mapinfo = await v2.beatmap.diff(beatmapId)
							mode = mapinfo.mode

							if (mapinfo.id == undefined) throw new Error("No Author")
							//send the embed
							await EmbedFunc(mapinfo, beatmapId, user, mode, value, pagenum, server, userstats)
							GoodToGo = true
							return
						} catch (err) {
							EmbedValue++
							ErrCount++
						}
					}
				}
			}
		}

		async function EmbedFunc(mapinfo, beatmapId, user, ModeOsu, value, pagenum, server, userstats) {
			message.channel.send({ embeds: [await CompareEmbed(mapinfo, beatmapId, user, ModeOsu, value, pagenum, server, userstats)] })
		}

		const channel = client.channels.cache.get(message.channel.id)
		channel.messages.fetch({ limit: 100 }).then(async messages => {
			//find the latest message with an embed
			let embedMessages = []
			for (const [id, message] of messages) {
				if (message.embeds.length > 0 && message.author.bot) {
					embedMessages.push(message)
				}
			}

			if (message.mentions.users.size > 0 && message.mentions.repliedUser?.bot) {
				message.channel.messages.fetch(message.reference.messageId).then(message => {
					const embed = message.embeds[0]

					EmbedFetch(embed)
				})
				return
			}

			try {
				if (embedMessages) {
					do {
						if (!embedMessages[EmbedValue].embeds[0]) break
						const embed = embedMessages[EmbedValue].embeds[0]
						await EmbedFetch(embed)
						console.log(GoodToGo)
					} while (!GoodToGo)
				} else {
					await message.channel.send("No embeds found in the last 100 messages")
				}
			} catch (err) {
				message.channel.send("**No maps found**")
			}
		})
	})
}
exports.name = "compare"
exports.aliases = ["compare", "c", "gap"]
exports.description = ["Displays your best scores of a beatmap.\n\n**Parameters:**\n`username` get the score of a user (must be first parameter)\n`link` get score by beatmap link \n`-i (number)` get a specific score.\n`-p (number)` get a specific page"]
exports.usage = [`compare https://osu.ppy.sh/b/1861487 whitecat`]
exports.category = ["osu"]
