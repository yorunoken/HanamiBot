const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const { v2, auth, mods, tools } = require("osu-api-extended")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")

async function GetUserTop(user, pageNumber, ModeOsu, RulesetId, args, ModsSearch, play_number) {
	//determine the page of the osutop
	const start = (pageNumber - 1) * 5 + 1
	const end = pageNumber * 5
	const numbers = []
	for (let i = start; i <= end; i++) {
		numbers.push(i)
	}
	one = numbers[0] - 1
	two = numbers[1] - 1
	three = numbers[2] - 1
	four = numbers[3] - 1
	five = numbers[4] - 1

	//score set
	let score = await v2.user.scores.category(user.id, "best", {
		mode: ModeOsu,
		limit: "100",
		offset: "0",
	})

	if (args.includes("-reverse") || args.includes("-rev")) {
		score.sort((b, a) => new Date(b.pp) - new Date(a.pp))
	} else {
		score.sort((b, a) => new Date(a.pp) - new Date(b.pp))
	}

	const scores = [...score]
	scores.sort((a, b) => b.weight.percentage - a.weight.percentage)

	if (ModsSearch != undefined) {
		sortmod = 1
		filteredscore = score.filter(x => x.mods.join("").split("").sort().join("").toLowerCase() == ModsSearch.split("").sort().join("").toLowerCase())
		score = filteredscore
		FilterMods = `**Filtering mod(s): ${score[value].mods.join("").toUpperCase()}**`
	}

	//formatted values for user
	try {
		global_rank = user.statistics.global_rank.toLocaleString()
		country_rank = user.statistics.country_rank.toLocaleString()
		pp = user.statistics.pp.toLocaleString()
	} catch (err) {
		global_rank = "0"
		country_rank = "0"
		pp = "0"
	}

	//define the grades
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

	async function ScoreGet(score) {
		const Play_rank = scores.findIndex(play => play.id === score.id) + 1

		if (!fs.existsSync(`./osuFiles/${score.beatmap.id}.osu`)) {
			console.log("no file.")
			const downloader = new Downloader({
				rootPath: "./osuFiles",

				filesPerSecond: 0,
			})

			downloader.addSingleEntry(score.beatmap.id)
			await downloader.downloadSingle()
		}

		let ModsName = score.mods.join("")
		let modsID = mods.id(ModsName)

		if (!ModsName.length) {
			ModsName = "NM"
			modsID = 0
		}

		let scoreParam = {
			mode: RulesetId,
			mods: modsID,
		}

		let AccValues
		if (score.mode_int == "0") AccValues = `{**${score.statistics.count_300}**/${score.statistics.count_100}/${score.statistics.count_50}/${score.statistics.count_miss}}`
		if (score.mode_int == "1") AccValues = `{**${score.statistics.count_300}**/${score.statistics.count_100}}/${score.statistics.count_miss}}`
		if (score.mode_int == "2") AccValues = `{**${score.statistics.count_300}**/${score.statistics.count_100}/${score.statistics.count_50}/${score.statistics.count_miss}}`
		if (score.mode_int == "3") AccValues = `{**${score.statistics.count_geki}**/${score.statistics.count_300}/${score.statistics.count_katu}/${score.statistics.count_100}/${score.statistics.count_50}/${score.statistics.count_miss}}`

		let map = new Beatmap({ path: `./osuFiles/${score.beatmap.id}.osu` })
		const calc = new Calculator(scoreParam)

		// ss pp
		const maxAttrs = calc.performance(map)

		//normal pp
		const CurAttrs = calc.n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nMisses(Number(score.statistics.count_miss)).combo(score.max_combo).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).performance(map)

		let FCAttrs = calc.n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nMisses(0).combo(maxAttrs.difficulty.maxCombo).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).performance(map)

		let grade = score.rank
		grade = grades[grade]

		const date = new Date(score.created_at)
		const ScoreSetTime = date.getTime() / 1000

		let Stars = maxAttrs.difficulty.stars.toFixed(2)
		let maxComboMap = maxAttrs.difficulty.maxCombo

		let first_row = `**${Play_rank}.** [**${score.beatmapset.title} [${score.beatmap.version}]**](https://osu.ppy.sh/b/${score.beatmap.id}) **+${ModsName}** [${Stars}★]\n`
		let second_row = `${grade} ▹ **${score.pp.toFixed(2)}PP** ▹ (${Number(score.accuracy * 100).toFixed(2)}%) ▹ [**${Number(score.max_combo)}x**/${maxComboMap}x]\n`
		let third_row = `${score.score.toLocaleString()} ▹ ${AccValues} <t:${ScoreSetTime}:R>`
		let fourth_row = ``
		let fifth_row = ``

		fields = ``
		footer = ``
		title = ``
		url = ``

		if (play_number) {
			let objects = score.beatmap.count_circles + score.beatmap.count_sliders + score.beatmap.count_spinners

			//set title
			let Title = `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}] [${CurAttrs.difficulty.stars.toFixed(2)}★]`

			if (CurAttrs.effectiveMissCount > 0) {
				Map300CountFc = objects - score.statistics.count_100 - score.statistics.count_50

				const FcAcc = tools.accuracy({
					300: Map300CountFc,
					geki: score.statistics.count_geki,
					100: score.statistics.count_100,
					katu: score.statistics.count_katu,
					50: score.statistics.count_50,
					0: 0,
					mode: ModeOsu,
				})
				console.log(FcAcc)

				pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP ▹ (**${FCAttrs.pp.toFixed(2)}**PP for **${FcAcc}%**)`
			} else {
				pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`
			}

			const mapValues = calc.mapAttributes(map)

			//length
			let Hit = score.beatmap.hit_length
			let Total = score.beatmap.total_length

			let minutesHit = Math.floor(Hit / 60)
			let secondsHit = (Hit % 60).toString().padStart(2, "0")
			let minutesTotal = Math.floor(Total / 60)
			let secondsTotal = (Total % 60).toString().padStart(2, "0")

			let scorerank = await v2.scores.details(score.best_id, "osu")
			if (score.passed == true) {
				if (scorerank.rank_global != undefined) {
					sc_rank = ` 🌐 #${scorerank.rank_global}`
				} else {
					sc_rank = " "
				}
			} else if (score.passed == false) {
				sc_rank = " "
			}

			let status = score.beatmapset.status.charAt(0).toUpperCase() + score.beatmapset.status.slice(1)

			first_row = `__**Personal Best #${Play_rank}:**__\n`
			second_row = `${grade} ** +${ModsName}** • ${score.score.toLocaleString()} • **(${Number(score.accuracy * 100).toFixed(2)}%) ${sc_rank}**\n`
			third_row = `${pps}\n`
			fourth_row = `[**${score.max_combo}**x/${CurAttrs.difficulty.maxCombo}x] • ${AccValues}\n`
			fifth_row = `Score Set <t:${ScoreSetTime}:R>`

			title = Title
			url = `https://osu.ppy.sh/b/${score.beatmap.id}`
			fields = { name: `**Beatmap info:**`, value: `BPM: \`${mapValues.bpm.toFixed()}\` Objects: \`${objects.toLocaleString()}\` Length: \`${minutesTotal}:${secondsTotal}\` (\`${minutesHit}:${secondsHit}\`)\nAR: \`${mapValues.ar.toFixed(1).toString().replace(/\.0+$/, "")}\` OD: \`${mapValues.od.toFixed(1).toString().replace(/\.0+$/, "")}\` CS: \`${mapValues.cs.toFixed(1).toString().replace(/\.0+$/, "")}\` HP: \`${mapValues.hp.toFixed(2).toString().replace(/\.0+$/, "")}\`` }
			footer = { text: `${status} map by ${score.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${score.beatmapset.user_id}?1668890819.jpeg` }
		}

		rows = `${first_row}${second_row}${third_row}${fourth_row}${fifth_row}`

		return { rows, title, url, fields, footer }
	}

	let thing1 = "**No scores found.**"
	let thing2 = ""
	let thing3 = ""
	let thing4 = ""
	let thing5 = ""

	let embed
	if (play_number) {
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username} ${pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
				iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
				url: `https://osu.ppy.sh/users/${user.id}`,
			})
			.setTitle(await (await ScoreGet(score[play_number - 1])).title)
			.setURL(await (await ScoreGet(score[play_number - 1])).url)
			.setDescription(await (await ScoreGet(score[play_number - 1])).rows)
			.setFields(await (await ScoreGet(score[play_number - 1])).fields)
			.setThumbnail(`https://assets.ppy.sh/beatmaps/${score[play_number - 1].beatmapset.id}/covers/list.jpg`)
			.setFooter(await (await ScoreGet(score[play_number - 1])).footer)
		return embed
	} else {
		const TotalPage = Math.ceil(score.length / 5)

		if (score[one]) thing1 = `${await (await ScoreGet(score[one])).rows}\n`
		if (score[two]) thing2 = `${await (await ScoreGet(score[two])).rows}\n`
		if (score[three]) thing3 = `${await (await ScoreGet(score[three])).rows}\n`
		if (score[four]) thing4 = `${await (await ScoreGet(score[four])).rows}\n`
		if (score[five]) thing5 = `${await (await ScoreGet(score[five])).rows}\n`

		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
				iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
				url: `https://osu.ppy.sh/users/${user.id}/${ModeOsu}`,
			})
			.setThumbnail(user.avatar_url)
			.setDescription(`${thing1}${thing2}${thing3}${thing4}${thing5}`)
			.setFooter({ text: `Page ${pageNumber}/${TotalPage}` })
		return embed
	}
}

module.exports = { GetUserTop }
