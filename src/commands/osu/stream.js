const { auth, v2 } = require("osu-api-extended")
const axios = require("axios")
const fs = require("fs")
const { EmbedBuilder } = require("discord.js")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()
	await auth.login(process.env.client_id, process.env.client_secret)

	async function MapInfoGet(DiffValues, beatmapId, data) {
		try {
			if (!fs.existsSync(`./osuFiles/${beatmapId}.osu`)) {
				console.log("no file.")
				const downloader = new Downloader({
					rootPath: "./osuFiles",

					filesPerSecond: 0,
				})

				downloader.addSingleEntry(beatmapId)
				await downloader.downloadSingle()
			}

			const RuleSetId = DiffValues.mode_int
			let mapParam = {
				path: `./osuFiles/${beatmapId}.osu`,
				ar: DiffValues.ar,
				cs: DiffValues.cs,
				hp: DiffValues.drain,
				od: DiffValues.accuracy,
			}

			let scoreParam = {
				mode: RuleSetId,
			}

			let map = new Beatmap(mapParam)
			let calc = new Calculator(scoreParam)

			const mapValues = calc.mapAttributes(map)

			const PP100 = calc.acc(100).performance(map)
			const PP99 = calc.acc(99).performance(map)
			const PP97 = calc.acc(97).performance(map)
			const PP95 = calc.acc(95).performance(map)

			if (!PP100.difficulty.nCircles) PP100.difficulty.nCircles = 0
			if (!PP100.difficulty.nSliders) PP100.difficulty.nSliders = 0
			if (!PP100.difficulty.nSpinners) PP100.difficulty.nSpinners = 0
			if (!PP100.difficulty.nFruits) PP100.difficulty.nFruits = 0

			let osuEmote
			if (DiffValues.mode == "osu") osuEmote = "<:osu:1075928459014066286>"
			if (DiffValues.mode == "mania") osuEmote = "<:mania:1075928451602718771>"
			if (DiffValues.mode == "taiko") osuEmote = "<:taiko:1075928454651969606>"
			if (DiffValues.mode == "fruits") osuEmote = "<:ctb:1075928456367444018>"

			//length
			let length = (DiffValues.total_length / mapValues.clockRate).toFixed(0)
			let minutes = Math.floor(length / 60)
			let seconds = (length % 60).toString().padStart(2, "0")

			// stream length
			let slength = (data.streams_length / mapValues.clockRate).toFixed(0)
			let sminutes = Math.floor(slength / 60)
			let sseconds = (slength % 60).toString().padStart(2, "0")

			//ranked or not
			let status = DiffValues.status.charAt(0).toUpperCase() + DiffValues.status.slice(1)

			//embed
			const embed = new EmbedBuilder()
				.setColor("Purple")
				.setAuthor({ name: `Beatmap by ${DiffValues.beatmapset.creator}`, url: `https://osu.ppy.sh/users/${DiffValues.user_id}`, iconURL: `https://a.ppy.sh/${DiffValues.user_id}?1668890819.jpeg` })
				.setTitle(`${DiffValues.beatmapset.artist} - ${DiffValues.beatmapset.title}`)
				.setFields({ name: `${osuEmote} **[${DiffValues.version}]**`, value: `Stars: \`${PP100.difficulty.stars.toFixed(2)}★\` Mods: \`NM\` BPM: \`${mapValues.bpm.toFixed()}\`\nLength: \`${minutes}:${seconds}\` Max Combo: \`${PP100.difficulty.maxCombo.toLocaleString()}x\` Objects: \`${PP100.difficulty.nCircles + PP100.difficulty.nSliders + PP100.difficulty.nSpinners + PP100.difficulty.nFruits}\`\nAR: \`${mapValues.ar.toFixed(1)}\` OD: \`${mapValues.od.toFixed(1)}\` CS: \`${mapValues.cs.toFixed(2)}\` HP: \`${mapValues.hp.toFixed(1)}\`\nLongest Stream: \`${data.longest_stream}\` Stream Density: \`${data.streams_density}\`\nStreams Length: \`${sminutes}:${sseconds}\` Spacing: \`${data.streams_spacing}\`` }, { name: "PP", value: `\`\`\`Acc | PP\n95%:  ${PP95.pp.toFixed(1)}\n97%:  ${PP97.pp.toFixed(1)}\n99%:  ${PP99.pp.toFixed(1)}\n100%: ${PP100.pp.toFixed(1)}\`\`\``, inline: true }, { name: "Links", value: `:notes:[Song Preview](https://b.ppy.sh/preview/${DiffValues.beatmapset_id}.mp3)\n🎬[Map Preview](https://osu.pages.dev/preview#${DiffValues.id})\n🖼️[Full Background](https://assets.ppy.sh/beatmaps/${DiffValues.beatmapset_id}/covers/raw.jpg)\n<:beatconnect:1075915329512931469>[Beatconnect](https://beatconnect.io/b/${DiffValues.beatmapset_id})\n<:kitsu:1075915745973776405>[Kitsu](https://kitsu.moe/d/${DiffValues.beatmapset_id})`, inline: true })
				.setURL(`https://osu.ppy.sh/b/${DiffValues.id}`)
				.setImage(`https://assets.ppy.sh/beatmaps/${DiffValues.beatmapset_id}/covers/cover.jpg`)
				.setFooter({ text: `${status} | ${DiffValues.beatmapset.favourite_count} ♥` })

			message.channel.send({ content: "Here is a beatmap with provided filters:", embeds: [embed] })
			return
		} catch (err) {
			console.log(err)
			// ErrCount++
		}
	}

	let argValues = {}
	for (const arg of args) {
		const [key, value] = arg.split("=")
		argValues[key] = value
	}

	// default settings for blank arguments
	const defaultmin = {
		property: "bpm",
		operator: "minimum",
		value: 1,
	}
	const defaultmax = {
		property: "bpm",
		operator: "maximum",
		value: 1000,
	}

	// od filter
	let od_min = defaultmin
	let od_max = defaultmax
	if (argValues["od"]) {
		od_min = {
			property: "accuracy",
			operator: "minimum",
			value: Number(argValues["od"]) - 0.2,
		}
		od_max = {
			property: "accuracy",
			operator: "maximum",
			value: Number(argValues["od"]) + 0.2,
		}
	}

	// ar filter
	let ar_min = defaultmin
	let ar_max = defaultmax
	if (argValues["ar"]) {
		ar_min = {
			property: "approach_rate",
			operator: "minimum",
			value: Number(argValues["ar"]) - 0.2,
		}
		ar_max = {
			property: "approach_rate",
			operator: "maximum",
			value: Number(argValues["ar"]) + 0.2,
		}
	}

	// bpm filter
	let bpm_min = defaultmin
	let bpm_max = defaultmax
	if (argValues["bpm"]) {
		bpm_min = {
			property: "bpm",
			operator: "minimum",
			value: Number(argValues["bpm"]) - 5,
		}
		bpm_max = {
			property: "bpm",
			operator: "maximum",
			value: Number(argValues["bpm"]) + 5,
		}
	}

	let cs_min = defaultmin
	let cs_max = defaultmax
	if (argValues["cs"]) {
		cs_min = {
			property: "circle_size",
			operator: "minimum",
			value: Number(argValues["cs"]) - 0.2,
		}
		cs_max = {
			property: "circle_size",
			operator: "maximum",
			value: Number(argValues["cs"]) + 0.2,
		}
	}

	let star_min = defaultmin
	let star_max = defaultmax
	if (argValues["star"]) {
		star_min = {
			property: "difficulty_rating",
			operator: "minimum",
			value: Number(argValues["star"]) - 0.1,
		}
		star_max = {
			property: "difficulty_rating",
			operator: "maximum",
			value: Number(argValues["star"]) + 0.1,
		}
	} else if (argValues["stars"]) {
		star_min = {
			property: "difficulty_rating",
			operator: "minimum",
			value: Number(argValues["stars"]) - 0.1,
		}
		star_max = {
			property: "difficulty_rating",
			operator: "maximum",
			value: Number(argValues["stars"]) + 0.1,
		}
	}

	let length_min = defaultmin
	let length_max = defaultmax
	if (argValues["length"]) {
		length_min = {
			property: "length",
			operator: "minimum",
			value: Number(argValues["length"]) - 15,
		}
		length_max = {
			property: "length",
			operator: "maximum",
			value: Number(argValues["length"]) + 15,
		}
	}

	let longest_min = defaultmin
	let longest_max = defaultmax
	if (argValues["longest"]) {
		longest_min = {
			property: "longest_stream",
			operator: "minimum",
			value: Number(argValues["longest"]) - 25,
		}
		longest_max = {
			property: "longest_stream",
			operator: "maximum",
			value: Number(argValues["longest"]) + 25,
		}
	}

	let pp_min = defaultmin
	let pp_max = defaultmax
	if (argValues["pp"]) {
		pp_min = {
			property: "performance_100",
			operator: "minimum",
			value: Number(argValues["pp"]) - 10,
		}
		pp_max = {
			property: "performance_100",
			operator: "maximum",
			value: Number(argValues["pp"]) + 10,
		}
	}

	let status = defaultmin
	if (argValues["status"]) {
		status = {
			property: "ranked_status",
			operator: "exact",
			value: argValues["status"],
		}
	}

	let density_min = defaultmin
	let density_max = defaultmax
	if (argValues["density"]) {
		density_min = {
			property: "streams_density",
			operator: "minimum",
			value: Number(argValues["density"]) - 0.03,
		}
		density_max = {
			property: "streams_density",
			operator: "maximum",
			value: Number(argValues["density"]) + 0.03,
		}
	}

	let streamlength_min = defaultmin
	let streamlength_max = defaultmax
	if (argValues["streamlength"]) {
		streamlength_min = {
			property: "streams_length",
			operator: "minimum",
			value: Number(argValues["streamlength"]) - 10,
		}
		streamlength_max = {
			property: "streams_length",
			operator: "maximum",
			value: Number(argValues["streamlength"]) + 10,
		}
	}

	let spacing_min = defaultmin
	let spacing_max = defaultmax
	if (argValues["spacing"]) {
		spacing_min = {
			property: "streams_spacing",
			operator: "minimum",
			value: Number(argValues["spacing"]) - 0.2,
		}
		spacing_max = {
			property: "streams_spacing",
			operator: "maximum",
			value: Number(argValues["spacing"]) + 0.2,
		}
	}

	const filters = [bpm_min, bpm_max, od_min, od_max, ar_min, ar_max, cs_min, cs_max, star_min, star_max, length_min, length_max, longest_min, longest_max, pp_min, pp_max, status, density_min, density_max, streamlength_min, streamlength_max, spacing_min, spacing_max]
	const endpoint = `https://ost.sombrax79.org/api/bot/beatmap/request`
	const headers = { "Content-Type": "application/json" }
	let data
	try {
		dataraw = await axios.post(endpoint, filters, { headers })
		data = dataraw.data
		console.log("file: stream.js:299 ~ exports.run= ~ data:", data)
	} catch (err) {
		message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setTitle("Hmm..").setDescription("There wasn't a beatmap with the filters you provided. Try a different filter or lower/raise your values")] })
		return
	}
	const mapinfo = await v2.beatmap.diff(data.id)
	MapInfoGet(mapinfo, data.id, data)
}

exports.name = "stream"
exports.aliases = ["stream", "recc", "recommend", "streamrec", "streamrecommend", "rec"]
exports.description = ["Recommends you a stream map by given parameters\n\n**Parameters:**\n`od=(number)` recommends you a map by its od (the od will have a value between -0.2 and +0.2)\n`ar=(number)` recommends you a map by its ar (the ar will have a value between -0.2 and +0.2)\n`cs=(number)` recommends you a map by its cs (the cs will have a value between -0.2 and +0.2)\n`bpm=(number)` recommends you a map by its bpm (the bpm will have a value between -5 and +5)\n`star=(number)` recommends you a map by its stars (the stars will have a value between -0.1 and +0.1)\n`length=(number)` recommends you a map by its length, in seconds (the length will have a value between -15 and +15)\n`longest=(number)` recommends you a map by its longest stream (the longest stream will have a value between -25 and +25)\n`pp=(number)` recommends you a map by its SS pp (the SS pp will have a value between -10 and +10)\n`status=(string)` recommends you a map by its ranked status. (ranked, loved, unranked)\n`density=(number)` recommends you a map by its stream density (the density will have a value between -0.03 and +0.03)\n`streamlength=(number)` recommends you a map by its streams length (the streams length will have a value between -10 and +10)\n`spacing=(number)` recommends you a map by its stream spacing (the spacing will have a value between -0.2 and +0.2)\n\n[Credits to Sombrax79 for making the website](https://ost.sombrax79.org/)"]
exports.usage = [`stream bpm=200 star=6.3 od=9.6`]
exports.category = ["osu"]
