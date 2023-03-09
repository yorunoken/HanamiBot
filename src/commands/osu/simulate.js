const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
const { BeatmapCalculator, ScoreCalculator } = require("@kionell/osu-pp-calculator")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	let EmbedValue = 0
	let GoodToGo = false

	await auth.login(process.env.client_id, process.env.client_secret)

	let argValues = {}
	for (const arg of args) {
		const [key, value] = arg.split("=")
		argValues[key] = value
	}

	async function SendEmbed(beatmapId) {
		try {
			//beatmap information
			const beatmapCalculator = new BeatmapCalculator()
			const map = await beatmapCalculator.calculate({
				beatmapId: beatmapId,
			})

			//if mods is undefined, set it to NM
			if (typeof argValues["mods"] === "undefined" || argValues["mods"] === "") {
				argValues["mods"] = "NM"
			}

			if (args.join(" ").includes("+")) {
				const iIndex = args.indexOf("+")
				modsArg = args[iIndex + 1]
					.slice(1)
					.toUpperCase()
					.match(/[A-Z]{2}/g)
				argValues["mods"] = modsArg.join("")
			}

			//if 50 is undefined, set it to 0
			if (typeof argValues["n50"] === "undefined" || argValues["n50"] === "") {
				argValues["n50"] = 0
			}
			//if 100 is undefined, set it to 0
			if (typeof argValues["n100"] === "undefined" || argValues["n100"] === "") {
				argValues["n100"] = 0
			}
			//if miss is undefined, set it to 0
			if (typeof argValues["miss"] === "undefined" || argValues["miss"] === "") {
				argValues["miss"] = 0
			}
			//if combo is undefined, set it to max combo
			if (typeof argValues["combo"] === "undefined" || argValues["combo"] === "") {
				argValues["combo"] = map.beatmapInfo.maxCombo
			}
			if (typeof argValues["cs"] === "undefined" || argValues["cs"] === "") {
				cs = undefined
			} else {
				cs = Number(argValues["cs"])
			}

			if (typeof argValues["ar"] === "undefined" || argValues["ar"] === "") {
				ar = undefined
			} else {
				ar = Number(argValues["ar"])
			}

			if (typeof argValues["od"] === "undefined" || argValues["od"] === "") {
				od = undefined
			} else {
				od = Number(argValues["od"])
			}

			if (typeof argValues["bpm"] === "undefined" || argValues["bpm"] === "") {
				bpm = undefined
			} else {
				bpm = Number(argValues["bpm"])
			}

			//pp Calculator
			const scoreCalculator = new ScoreCalculator()
			const pp = await scoreCalculator.calculate({
				beatmapId: map.beatmapInfo.id,
				mods: argValues["mods"],
				count50: Number(argValues["n50"]),
				count100: Number(argValues["n100"]),
				countMiss: Number(argValues["miss"]),
				maxCombo: Number(argValues["combo"]),
				circleSize: cs,
				approachRate: ar,
				overallDifficulty: od,
				bpm: bpm,
				fix: false,
			})

			//grades
			const grades = {
				A: "<:A_:1057763284327080036>",
				B: "<:B_:1057763286097076405>",
				C: "<:C_:1057763287565086790>",
				D: "<:D_:1057763289121173554>",
				F: "<:F_:1057763290484318360>",
				S: "<:S_:1057763291998474283>",
				SH: "<:SH_:1057763293491642568>",
				X: "<:X_:1057763294707974215>",
				XH: "<:XH_:1057763296717045891>",
			}
			let grade = pp.scoreInfo.rank
			grade = grades[grade]

			//length
			let length = pp.scoreInfo.beatmap.length.toFixed(0)
			let minutes = Math.floor(length / 60)
			let seconds = (length % 60).toString().padStart(2, "0")

			//embed
			const embed = new EmbedBuilder()
				.setColor("Purple")
				.setTitle(`${map.beatmapInfo.artist} - ${map.beatmapInfo.title} [${map.beatmapInfo.version}]`)
				.setURL(`https://osu.ppy.sh/b/${map.beatmapInfo.id}`)
				.setDescription(`${grade} +${pp.scoreInfo.mods} - **${pp.performance.totalPerformance.toFixed(2)}PP (${(pp.scoreInfo.accuracy * 100).toFixed(2)}%)**\n{ **${pp.scoreInfo.maxCombo}x**/${map.beatmapInfo.maxCombo}x } [**${pp.scoreInfo.count300}**/${pp.scoreInfo.count100}/${pp.scoreInfo.count50}/${pp.scoreInfo.countMiss}]`)
				.setFields({
					name: `**Beatmap info:**`,
					value: `Stars: \`${pp.difficulty.starRating.toFixed(2)}★\` BPM: \`${pp.scoreInfo.beatmap.bpmMode.toFixed()}\` Length: \`${minutes}:${seconds}\`\nAR: \`${pp.difficulty.approachRate.toFixed(2)}\` OD: \`${pp.difficulty.overallDifficulty.toFixed(2)}\` CS: \`${pp.scoreInfo.beatmap.circleSize.toFixed(2)}\` HP: \`${pp.scoreInfo.beatmap.drainRate.toFixed(2)}\``,
				})
				.setThumbnail(`https://assets.ppy.sh/beatmaps/${map.beatmapInfo.beatmapsetId}/covers/list.jpg`)

			message.channel.send({ embeds: [embed] })
		} catch (err) {}
	}

	async function EmbedFetch(embed) {
		try {
			const embed_author = embed.url
			if (embed_author.includes("/users/")) throw new Error("Wrong embed")
			if (embed_author.includes("/u/")) throw new Error("Wrong embed")
			const beatmapId = embed_author.match(/\d+/)[0]

			const ranked = await v2.beatmap.diff(beatmapId)
			if (ranked.id == undefined) throw new Error("No URL")
			//send the embed
			await SendEmbed(beatmapId)
			GoodToGo = true
			return
		} catch (err) {
			console.log(err)

			console.log("err found, switching to author")

			try {
				const embed_author = embed.author.url
				if (embed_author.includes("/users/")) throw new Error("Wrong embed")
				if (embed_author.includes("/u/")) throw new Error("Wrong embed")
				const beatmapId = embed_author.match(/\d+/)[0]

				const ranked = await v2.beatmap.diff(beatmapId)
				if (ranked.id == undefined) throw new Error("No Author")

				//send the embed
				await SendEmbed(beatmapId)
				GoodToGo = true
				return
			} catch (err) {
				console.log(err)

				console.log("err found, switching to desc")
				try {
					const regex = /\/b\/(\d+)/
					const match = regex.exec(embed.description)
					const beatmapId = match[1]

					const ranked = await v2.beatmap.diff(beatmapId)
					if (ranked.id == undefined) throw new Error("No Desc")
					//send the embed
					await SendEmbed(beatmapId)
					GoodToGo = true
					return
				} catch (err) {
					console.log(err)
					EmbedValue++
				}
			}
		}
	}

	if (message.mentions.users.size > 0 && message.mentions.repliedUser.bot) {
		message.channel.messages.fetch(message.reference.messageId).then(message => {
			const embed = message.embeds[0]
			EmbedFetch(embed)
		})
		return
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

		try {
			if (args) {
				//if args doesn't start with https: try to get the beatmap id by number provided
				if (!args[0].startsWith("https:")) {
					beatmapId = args[0]
				} else {
					//try to get beatmapId by link
					const regex = /\/(\d+)$/
					const match = regex.exec(args[0])
					beatmapId = match[1]
				}
				const ranked = await v2.beatmap.diff(beatmapId)

				if (ranked.id == undefined) throw new Error("No html")

				//send the embed
				await SendEmbed(beatmapId)
				return
			}
		} catch (err) {
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
		}
	})
}
exports.name = "simulate"
exports.aliases = ["simulate", "sim", "s"]
exports.description = ["Simulates a score on a beatmap.\n\n**Parameters:**\n`link` simulate a beatmap typing a link\n`n300=value`\n`n100=value`\n`n50=value`\n`miss=value`\n`BPM=value`\n`AR=value`\n`OD=value`\n`CS=value`\n`combo=value`\n`mods=string`"]
exports.usage = [`simulate https://osu.ppy.sh/b/552068 n100=34 miss=4 combo=900 mods=hr`]
exports.category = ["osu"]
