const fs = require("fs")
const { v2, auth, tools, mods } = require("osu-api-extended")

// importing CompareEmbed
const { CompareEmbed } = require("../../exports/compare_export.js")

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		let userargs
		let value = undefined
		let pagenum = 1

		let ModeOsu
		try {
			ModeOsu = userData[message.author.id].osumode
			if (ModeOsu == undefined) ModeOsu = "osu"
		} catch (err) {
			ModeOsu = "osu"
		}

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
					userargs = userData[mentionedUser.id].osuUsername
				}
			} catch (err) {
				console.error(err)
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						try {
							userData[mentionedUser.id].osuUsername
						} catch (err) {
							message.reply(`No osu! user found for ${mentionedUser.tag}`)
						}
					} else {
						try {
							userData[message.author.id].osuUsername
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
				try {
					if (args.includes("-osu")) {
						RuleSetId = 0
						ModeOsu = "osu"
					}
					if (args.join(" ").startsWith("-osu")) userargs = userData[message.author.id].osuUsername

					if (args.includes("-mania")) {
						RuleSetId = 3
						ModeOsu = "mania"
					}
					if (args.join(" ").startsWith("-mania")) userargs = userData[message.author.id].osuUsername

					if (args.includes("-taiko")) {
						RuleSetId = 1
						ModeOsu = "taiko"
					}
					if (args.join(" ").startsWith("-taiko")) userargs = userData[message.author.id].osuUsername

					if (args.includes("-ctb")) {
						RuleSetId = 2
						ModeOsu = "ctb"
					}
					if (args.join(" ").startsWith("-ctb")) userargs = userData[message.author.id].osuUsername

					if (args.join(" ").startsWith("-i") || args.join(" ").startsWith("-p")) {
						userargs = userData[message.author.id].osuUsername
					}
				} catch (err) {
					message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
				}
			}
		}

		console.log(userargs)

		if (userargs?.length === 0 || userargs === undefined) {
			try {
				userargs = userData[message.author.id].osuUsername
			} catch (err) {
				message.reply(`No osu! user found for ${mentionedUser.tag}`)
			}
		}

		console.log(value, pagenum, userargs)

		//log into api
		await auth.login(process.env.client_id, process.env.client_secret)
		let user = await v2.user.details(userargs, ModeOsu)

		if (user.id == undefined) {
			message.reply(`**The user ${userargs} doesn't exist.**`)
			return
		}

		async function EmbedFetch(embed) {
			try {
				console.log("lksdfg dsf;lgfsdkl; gsfdkl;")

				const beatmapId = args[0].match(/\d+/)[0]
				console.log("file: compare.js:151 ~ EmbedFetch ~ beatmapId:", beatmapId)
				// if args doesn't start with https: try to get the beatmap id by number provided
				if (!args[0].startsWith("https:")) {
					beatmapId = args[0]
				}

				if (userargs.startsWith("https")) {
					console.log("startswith")
					userargs = userData[message.author.id].osuUsername

					if (args[1]) {
						userargs = args[1]
						if (string) {
							userargs = string[1]
						}
					}
				}

				try {
					user = await v2.user.details(userargs, ModeOsu)
					const mapinfo = await v2.beatmap.diff(beatmapId)
					ModeOsu = mapinfo.mode

					// send the embed
					await EmbedFunc(mapinfo, beatmapId, user, ModeOsu, value, pagenum)

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
					console.log(beatmapId)

					const mapinfo = await v2.beatmap.diff(beatmapId)

					if (mapinfo.id == undefined) throw new Error("No Author")
					ModeOsu = mapinfo.mode

					//send the embed
					await EmbedFunc(mapinfo, beatmapId, user, ModeOsu, value, pagenum)
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
						ModeOsu = mapinfo.mode

						//send the embed
						await EmbedFunc(mapinfo, beatmapId, user, ModeOsu, value, pagenum)
						GoodToGo = true
					} catch (err) {
						console.log(err)

						console.log("err found, switching to desc")
						try {
							const regex = /\/b\/(\d+)/
							const match = regex.exec(embed.description)
							const beatmapId = match[1]

							const mapinfo = await v2.beatmap.diff(beatmapId)
							ModeOsu = mapinfo.mode

							if (mapinfo.id == undefined) throw new Error("No Author")
							//send the embed
							await EmbedFunc(mapinfo, beatmapId, user, ModeOsu, value, pagenum)
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

		async function EmbedFunc(mapinfo, beatmapId, user, ModeOsu, value, pagenum) {
			if (value >= 0) {
				console.log("value")
				message.channel.send({ embeds: [await CompareEmbed(mapinfo, beatmapId, user, ModeOsu, value, pagenum)] })
			} else {
				console.log("not defined")
				message.channel.send({ embeds: [await CompareEmbed(mapinfo, beatmapId, user, ModeOsu, value, pagenum)] })
			}
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
