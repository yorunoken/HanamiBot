const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const { v2, auth, mods, tools } = require("osu-api-extended")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")

async function LbSend(beatmapId, scores, pagenum, mapinfo, AuthorsName) {
	await auth.login(process.env.client_id, process.env.client_secret)

	const start = (pagenum - 1) * 5 + 1
	const end = pagenum * 5
	const numbers = []
	for (let i = start; i <= end; i++) {
		numbers.push(i)
	}
	const one = numbers[0] - 1
	const two = numbers[1] - 1
	const three = numbers[2] - 1
	const four = numbers[3] - 1
	const five = numbers[4] - 1

	if (scores.scores.length == 0) {
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}]`) // [${starRating.difficulty.starRating.toFixed(2)}★]
			.setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
			.setDescription(`**No scores found.**`)
			.setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)

		return embed
	}

	try {
		if (!fs.existsSync(`./osuBeatmapCache/${beatmapId}.osu`)) {
			console.log("no file.")
			const downloader = new Downloader({
				rootPath: "./osuBeatmapCache",

				filesPerSecond: 0,
			})
			downloader.addSingleEntry(beatmapId)
			await downloader.downloadSingle()
		}

		let map = new Beatmap({ path: `./osuBeatmapCache/${beatmapId}.osu` })

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

		const totalPage = Math.ceil(scores.scores.length / 5)

		async function ScoreGet(score, num) {
			const ModsRaw = score.mods.map(mod => mod.acronym).join("")
			let modsID = mods.id(ModsRaw)
			if (ModsRaw != "") {
				Mods1 = `\`+${ModsRaw}\` `
			} else {
				Mods1 = ""
				modsID = 0
			}

			// std
			if (score.statistics.great === undefined) score.statistics.great = 0
			if (score.statistics.ok === undefined) score.statistics.ok = 0
			if (score.statistics.meh === undefined) score.statistics.meh = 0
			if (score.statistics.miss === undefined) score.statistics.miss = 0

			// mania
			if (score.statistics.perfect === undefined) score.statistics.perfect = 0 // geki
			if (score.statistics.good === undefined) score.statistics.good = 0 // katu

			let AccValues
			if (mapinfo.mode_int == "0") AccValues = `{**${score.statistics.great}**/${score.statistics.ok}/${score.statistics.meh}/${score.statistics.miss}}`
			if (mapinfo.mode_int == "1") AccValues = `{**${score.statistics.great}**/${score.statistics.ok}}/${score.statistics.miss}}`
			if (mapinfo.mode_int == "2") AccValues = `{**${score.statistics.great}**/${score.statistics.ok}/${score.statistics.meh}/${score.statistics.miss}}`
			if (mapinfo.mode_int == "3") AccValues = `{**${score.statistics.perfect}/${score.statistics.great}**/${score.statistics.good}/${score.statistics.ok}/${score.statistics.meh}/${score.statistics.miss}}`

			const scoreParam = {
				mode: 0,
				mods: modsID,
			}

			const calc = new Calculator(scoreParam)

			// ss pp
			const maxAttrs = calc.performance(map)

			//normal pp
			const CurAttrs = calc.n100(score.statistics.ok).n300(score.statistics.great).n50(score.statistics.meh).nMisses(Number(score.statistics.miss)).combo(score.max_combo).nGeki(score.statistics.perfect).nKatu(score.statistics.good).performance(map)

			let grade = score.rank
			grade = grades[grade]

			PP = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

			const date = new Date(score.ended_at)
			const UnixDate = date.getTime() / 1000

			let first_row = `**${num + 1}.** ${grade} [**${score.user.username}**](https://osu.ppy.sh/users/${score.user.id}) ${Mods1}**__[${CurAttrs.difficulty.stars.toFixed(2)}★]__**\n`
			let second_row = `▹${PP} ▹ (${(score.accuracy * 100).toFixed(2)}%) • ${score.total_score.toLocaleString()}\n`
			let third_row = `▹[ **${score.max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] • ${AccValues} <t:${UnixDate}:R>`

			if (YourScore) {
				first_row = `**${num + 1}.** ${grade} [**${score.user.username}**](https://osu.ppy.sh/users/${score.user.id}) (${(score.accuracy * 100).toFixed(2)}%) ${Mods1} **${score.statistics.miss}**<:hit00:1061254490075955231> <t:${UnixDate}:R>\n`
				second_row = `▹ ${PP} [ **${score.max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] **__[${CurAttrs.difficulty.stars.toFixed(2)}★]__**`
				third_row = ``
			}

			return `${first_row}${second_row}${third_row}`
		}

		let YourScore = false

		first_score = "**No scores found.**"
		if (scores.scores[one]) first_score = `${await ScoreGet(scores.scores[one], one, YourScore)}\n`
		else {
			if (pagenum > totalPage || pagenum < 0) {
				const embed = new EmbedBuilder()
					.setColor("Red")
					.setTitle(`Error..`) // [${starRating.difficulty.starRating.toFixed(2)}★]
					.setDescription(`**Please pick a page between \`1\` and \`${totalPage}\`**`)
				return embed
			}
		}

		second_score = ""
		if (scores.scores[two]) second_score = `${await ScoreGet(scores.scores[two], two, YourScore)}\n`

		third_score = ""
		if (scores.scores[three]) third_score = `${await ScoreGet(scores.scores[three], three, YourScore)}\n`

		fourth_score = ""
		if (scores.scores[four]) fourth_score = `${await ScoreGet(scores.scores[four], four, YourScore)}\n`

		fifth_score = ""
		if (scores.scores[five]) fifth_score = `${await ScoreGet(scores.scores[five], five, YourScore)}\n`

		user_score = ""
		if (AuthorsName) {
			let index = scores.scores.findIndex(x => x.user.id == AuthorsName)
			if (index == -1) {
				index = scores.scores.findIndex(x => x.user.username == AuthorsName)
			}
			if (index == -1) {
			} else {
				YourScore = true
				user_score = `\n__**Your score:**__\n${await ScoreGet(scores.scores[index], index, YourScore)}`
			}
		}

		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}]`) // [${starRating.difficulty.starRating.toFixed(2)}★]
			.setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
			.setDescription(`${first_score}${second_score}${third_score}${fourth_score}${fifth_score}${user_score}`)
			.setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
			.setFooter({ text: `Page: ${pagenum}/${totalPage}` })

		return embed
	} catch (err) {
		console.log(err)
	}
}

module.exports = { LbSend }
