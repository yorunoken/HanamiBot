const { v2, auth } = require("osu-api-extended")
const fs = require("fs")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")
const { EmbedBuilder } = require("discord.js")
const { createWorker } = require("tesseract.js")

exports.run = async (client, message, args, prefix) => {
	async function mapFunc(mapinfo, mapId, MapBy, MapTitleArtist) {
		console.log(mapinfo)

		if (!fs.existsSync(`./osuBeatmapCache/${mapId}.osu`)) {
			console.log("no file.")
			const downloader = new Downloader({
				rootPath: "./osuBeatmapCache",

				filesPerSecond: 0,
			})

			downloader.addSingleEntry(mapId)
			await downloader.downloadSingle()
		}

		var clock_rate = 1

		const RuleSetId = mapinfo.mode_int
		let mapParam = {
			path: `./osuBeatmapCache/${mapId}.osu`,
		}

		let scoreParam = {
			mode: RuleSetId,
			mods: 0,
		}

		let map = new Beatmap(mapParam)
		let calc = new Calculator(scoreParam)

		const mapValues = calc.clockRate(clock_rate).mapAttributes(map)

		const PP100 = calc.clockRate(clock_rate).acc(100).performance(map)
		const PP99 = calc.clockRate(clock_rate).acc(99).performance(map)
		const PP97 = calc.clockRate(clock_rate).acc(97).performance(map)
		const PP95 = calc.clockRate(clock_rate).acc(95).performance(map)

		if (!PP100.difficulty.nCircles) PP100.difficulty.nCircles = 0
		if (!PP100.difficulty.nSliders) PP100.difficulty.nSliders = 0
		if (!PP100.difficulty.nSpinners) PP100.difficulty.nSpinners = 0
		if (!PP100.difficulty.nFruits) PP100.difficulty.nFruits = 0

		let osuEmote
		if (mapinfo.mode == "osu") osuEmote = "<:osu:1075928459014066286>"
		if (mapinfo.mode == "mania") osuEmote = "<:mania:1075928451602718771>"
		if (mapinfo.mode == "taiko") osuEmote = "<:taiko:1075928454651969606>"
		if (mapinfo.mode == "fruits") osuEmote = "<:ctb:1075928456367444018>"

		//length
		let length = (mapinfo.total_length / mapValues.clockRate).toFixed(0)
		let minutes = Math.floor(length / 60)
		let seconds = (length % 60).toString().padStart(2, "0")

		var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
		let Updated_at = `Last updated at ${new Date(mapinfo.last_updated).toLocaleDateString("en-US", options)}`
		if (mapinfo.status == "ranked") Updated_at = `Ranked at ${new Date(mapinfo.last_updated).toLocaleDateString("en-US", options)}`
		if (mapinfo.status == "loved") Updated_at = `Loved at ${new Date(mapinfo.last_updated).toLocaleDateString("en-US", options)}`
		if (mapinfo.status == "qualified") Updated_at = `Qualified at ${new Date(mapinfo.last_updated).toLocaleDateString("en-US", options)}`

		const field1 = { name: `${osuEmote} **[${mapinfo.version}]**`, value: `Stars: \`${PP100.difficulty.stars.toFixed(2)}★\` Mods: \`NM\` BPM: \`${mapValues.bpm.toFixed()}\`\nLength: \`${minutes}:${seconds}\` Max Combo: \`${PP100.difficulty.maxCombo.toLocaleString()}x\` Objects: \`${PP100.difficulty.nCircles + PP100.difficulty.nSliders + PP100.difficulty.nSpinners + PP100.difficulty.nFruits}\`\nAR: \`${mapValues.ar.toFixed(1)}\` OD: \`${mapValues.od.toFixed(1)}\` CS: \`${mapValues.cs.toFixed(2)}\` HP: \`${mapValues.hp.toFixed(1)}\`` }
		const field2 = { name: "PP", value: `\`\`\`Acc | PP\n95%:  ${PP95.pp.toFixed(1)}\n97%:  ${PP97.pp.toFixed(1)}\n99%:  ${PP99.pp.toFixed(1)}\n100%: ${PP100.pp.toFixed(1)}\`\`\``, inline: true }
		const field3 = { name: "Links", value: `:notes:[Song Preview](https://b.ppy.sh/preview/${mapinfo.beatmapset_id}.mp3)\n🎬[Map Preview](https://osu.pages.dev/preview#${mapinfo.id})\n🖼️[Full Background](https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/raw.jpg)\n<:beatconnect:1075915329512931469>[Beatconnect](https://beatconnect.io/b/${mapinfo.beatmapset_id})\n<:kitsu:1075915745973776405>[Kitsu](https://kitsu.moe/d/${mapinfo.beatmapset_id})`, inline: true }

		//embed
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({ name: MapBy, url: `https://osu.ppy.sh/users/${mapinfo.user_id}`, iconURL: `https://a.ppy.sh/${mapinfo.user_id}?1668890819.jpeg` })
			.setTitle(MapTitleArtist)
			.setFields(field1, field2, field3)
			.setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
			.setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
			.setFooter({ text: `${Updated_at}` })

		message.channel.send({ embeds: [embed] })
		return
	}

	async function EmbedFetch(FetchedMessage) {
		var embed = FetchedMessage.embeds[0]
		var attachment = FetchedMessage.attachments
		var url

		if (embed != undefined) url = embed.data.url
		else url = Array.from(attachment)[0][1].url

		console.log(url)

		const worker = await createWorker({
			logger: m => console.log(m),
		})

		;(async () => {
			await worker.loadLanguage("eng")
			await worker.initialize("eng")
			const {
				data: { text },
			} = await worker.recognize(url)

			ParsedArray = text.split("\n\n")
			console.log(ParsedArray)

			var query = `${ParsedArray[0]} ${ParsedArray[1]}`

			await auth.login_lazer(process.env.userd, process.env.pass)
			const search = await v2.beatmap.search({
				query: query,
				section: "any",
				nsfw: true,
			})

			var VersionData = ParsedArray[0]
			var Version = VersionData.substring(VersionData.lastIndexOf("["))
			var CleanedVersion = Version.replace("[", "").replace("]", "")

			var map = search.beatmapsets[0].beatmaps.find(x => x.version.toLowerCase() == CleanedVersion.toLowerCase())

			var MapTitleArtist = VersionData.replace(Version, "")
			await mapFunc(map, map.id, ParsedArray[1], MapTitleArtist)

			await worker.terminate()
		})()
	}

	try {
		if (message.reference.messageId) {
			await message.channel.sendTyping()

			message.channel.messages.fetch(message.reference.messageId).then(async FetchedMessage => {
				await EmbedFetch(FetchedMessage)
			})
			return
		}
	} catch (err) {}
}
exports.name = ["ocr"]
exports.aliases = ["ocr"]
exports.description = [""]
exports.usage = [`ocr [link]`]
exports.category = ["osu"]
