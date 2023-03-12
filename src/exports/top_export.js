const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const { v2, auth, mods, tools } = require("osu-api-extended")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")
const axios = require("axios")

async function GetUserTop(user, userstats, pageNumber, ModeOsu, RuleSetId, args, ModsSearch, play_number, rb, server) {
	console.log("file: top_export.js:8 ~ GetUserTop ~ RuleSetId:", RuleSetId)

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

	let Play_rank = ""
	let score, FilterMods, global_rank, country_rank, user_pp, country, useravatar

	if (server == "bancho") {
		//score set
		score = await v2.user.scores.category(user.id, "best", {
			mode: ModeOsu,
			limit: "100",
			offset: "0",
		})

		/**
		if (ModsSearch != undefined) {
			filteredscore = score.filter(x => x.mods.join("").split("").sort().join("").toLowerCase() == ModsSearch.split("").sort().join("").toLowerCase())
			score = filteredscore
			try {
				FilterMods = `**Filtering mod(s): ${score[value].mods.join("").toUpperCase()}**`
			} catch (err) {
				const embed = new EmbedBuilder().setColor("Purple").setDescription("Please provide a valid mod combination.")
				return embed
			}
		}
		 */

		//formatted values for user
		try {
			global_rank = user.statistics.global_rank.toLocaleString()
			country_rank = user.statistics.country_rank.toLocaleString()
		} catch (err) {
			global_rank = "0"
			country_rank = "0"
		}
		user_pp = user.statistics.pp.toLocaleString()
		country = user.country_code
		useravatar = user.avatar_url
	}

	if (server == "gatari") {
		let modSort
		try {
			modSort = mods.id(ModsSearch)
			if (modSort == undefined) modSort = ""
		} catch (err) {
			modSort = ""
		}

		var url = `https://api.gatari.pw/user/scores/best`
		const response = await axios.get(`${url}?id=${user.id}&l=100&p=1&mode=${RuleSetId}&mods=${modSort}`)

		score = response.data.scores
		if (score == null) {
			let embed = new EmbedBuilder().setColor("Purple").setDescription(`No Gatari plays found for **${user.username}**`)
			return { embed, FilterMods }
		}

		//formatted values for user
		try {
			global_rank = userstats.rank.toLocaleString()
			country_rank = userstats.country_rank.toLocaleString()
		} catch (err) {
			global_rank = "0"
			country_rank = "0"
		}
		user_pp = userstats.pp
		country = user.country
		useravatar = `https://a.gatari.pw/${user.id}`
	}

	if (rb) {
		if (server == "bancho") {
			if (args.includes("-reverse") || args.includes("-rev")) {
				score.sort((b, a) => new Date(b.created_at) - new Date(a.created_at))
			} else {
				score.sort((b, a) => new Date(a.created_at) - new Date(b.created_at))
			}

			const scores = [...score]
			scores.sort((a, b) => b.weight.percentage - a.weight.percentage)
			Play_rank = scores.findIndex(play => play.id === score.id) + 1
		}
		if (server == "gatari") {
			if (args.includes("-reverse") || args.includes("-rev")) {
				score.sort((b, a) => new Date(b.time) - new Date(a.time))
			} else {
				score.sort((b, a) => new Date(a.time) - new Date(b.time))
			}

			const scores = [...score]
			scores.sort((a, b) => b.pp - a.pp)
			Play_rank = scores.findIndex(play => play.id === score.id) + 1
		}
	} else {
		if (args.includes("-reverse") || args.includes("-rev")) {
			score.sort((b, a) => new Date(b.pp) - new Date(a.pp))
		} else {
			score.sort((b, a) => new Date(a.pp) - new Date(b.pp))
		}
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
	const scores = [...score]

	async function ScoreGet(score) {
		scores.sort((a, b) => b.pp - a.pp)
		Play_rank = scores.findIndex(play => play.id === score.id) + 1
		console.log("hi", Play_rank)

		let mapId, ModsName, modsID, grade, ScoreSetTime, MapTitle, acc, MapArtist
		let valuegeki,
			value300,
			valuekatu,
			value100,
			value50,
			valuemiss,
			valuecombo = 0

		if (server == "bancho") {
			mapId = score.beatmap.id
			ModsName = score.mods.join("")
			modsID = mods.id(ModsName)

			valuegeki = score.statistics.count_geki
			value300 = score.statistics.count_300
			valuekatu = score.statistics.count_katu
			value100 = score.statistics.count_100
			value50 = score.statistics.count_50
			valuemiss = score.statistics.count_miss
			valuecombo = score.max_combo

			grade = score.rank

			const date = new Date(score.created_at)
			ScoreSetTime = date.getTime() / 1000

			MapTitle = score.beatmapset.title
			MapArtist = score.beatmapset.artist

			acc = `(${Number(score.accuracy * 100).toFixed(2)}%)`
		}

		if (server == "gatari") {
			mapId = score.beatmap.beatmap_id
			modsID = score.mods
			ModsName = mods.name(modsID)

			valuegeki = score.count_gekis
			value300 = score.count_300
			valuekatu = score.count_katu
			value100 = score.count_100
			value50 = score.count_50
			valuemiss = score.count_miss
			valuecombo = score.max_combo

			grade = score.ranking

			const date = new Date(score.time)
			ScoreSetTime = date.getTime()

			MapTitle = score.beatmap.title
			MapArtist = score.beatmap.artist

			acc = `(${Number(score.accuracy).toFixed(2)}%)`
		}

		if (!fs.existsSync(`./osuBeatmapCache/${mapId}.osu`)) {
			console.log("no file.")
			const downloader = new Downloader({
				rootPath: "./osuBeatmapCache",

				filesPerSecond: 0,
			})

			downloader.addSingleEntry(mapId)
			await downloader.downloadSingle()
		}

		if (!ModsName.length) {
			ModsName = "NM"
			modsID = 0
		}

		let scoreParam = {
			mode: RuleSetId,
			mods: modsID,
		}

		let AccValues
		if (RuleSetId == "0") AccValues = `{**${value300}**/${value100}/${value50}/${valuemiss}}`
		if (RuleSetId == "1") AccValues = `{**${value300}**/${value100}/${valuemiss}}`
		if (RuleSetId == "2") AccValues = `{**${value300}**/${value100}/${value50}/${valuemiss}}`
		if (RuleSetId == "3") AccValues = `{**${valuegeki}/${value300}**/${valuekatu}/${value100}/${value50}/${valuemiss}}`

		let map = new Beatmap({ path: `./osuBeatmapCache/${mapId}.osu` })
		const calc = new Calculator(scoreParam)

		// ss pp
		const maxAttrs = calc.performance(map)

		//normal pp
		let CurAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(valuemiss).combo(valuecombo).nGeki(valuegeki).nKatu(valuekatu).performance(map)

		//fc pp
		let FCAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(0).combo(maxAttrs.difficulty.maxCombo).nGeki(valuegeki).nKatu(valuekatu).performance(map)

		grade = grades[grade]

		let Stars = maxAttrs.difficulty.stars.toFixed(2)
		let maxComboMap = maxAttrs.difficulty.maxCombo

		let first_row = `**${Play_rank}.** [**${MapTitle} [${score.beatmap.version}]**](https://osu.ppy.sh/b/${mapId}) **+${ModsName}** [${Stars}★]\n`
		let second_row = `${grade} ▹ **${score.pp.toFixed(2)}PP** ▹ ${acc} ▹ [**${Number(score.max_combo)}x**/${maxComboMap}x]\n`
		let third_row = `${score.score.toLocaleString()} ▹ ${AccValues} <t:${ScoreSetTime}:R>`
		let fourth_row = ``
		let fifth_row = ``

		fields = ``
		footer = ``
		title = ``
		url = ``

		if (play_number) {
			console.log("play number")

			let objects, status, acc, creator, creator_id
			let sc_rank = " "
			if (server == "bancho") {
				if (score.passed == true) {
					let scorerank = await v2.scores.details(score.best_id, "osu")
					if (scorerank.rank_global != undefined) {
						sc_rank = ` 🌐 #${scorerank.rank_global}`
					} else {
						sc_rank = " "
					}
				}

				acc = `(${Number(score.accuracy * 100).toFixed(2)}%)`

				status = score.beatmapset.status.charAt(0).toUpperCase() + score.beatmapset.status.slice(1)

				creator = score.beatmapset.creator
				creator_id = score.beatmapset.user_id

				hitLength = score.beatmap.hit_length
				totalLength = score.beatmap.total_length
				objects = score.beatmap.count_circles + score.beatmap.count_sliders + score.beatmap.count_spinners
			}
			if (server == "gatari") {
				//log in
				await auth.login(process.env.client_id, process.env.client_secret)
				var BeatmapGatari = await v2.beatmap.diff(mapId)

				if (score.beatmap.ranked == 0) status = `Unranked`
				if (score.beatmap.ranked == 2) status = `Ranked`
				if (score.beatmap.ranked == 3) status = `Approved`
				if (score.beatmap.ranked == 4) status = `Qualified`
				if (score.beatmap.ranked == 5) status = `Loved`

				acc = `(${Number(score.accuracy).toFixed(2)}%)`

				creator = score.beatmap.creator
				creator_id = BeatmapGatari.user_id

				hitLength = BeatmapGatari.hit_length
				totalLength = BeatmapGatari.total_length
				objects = BeatmapGatari.count_circles + BeatmapGatari.count_sliders + BeatmapGatari.count_spinners
			}

			//set title
			let Title = `${MapArtist} - ${MapTitle} [${score.beatmap.version}] [${CurAttrs.difficulty.stars.toFixed(2)}★]`

			if (CurAttrs.effectiveMissCount > 0) {
				Map300CountFc = objects - value100 - value50

				const FcAcc = tools.accuracy({
					300: Map300CountFc,
					geki: valuegeki,
					100: value100,
					katu: valuekatu,
					50: value50,
					0: 0,
					mode: ModeOsu,
				})

				pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP ▹ (**${FCAttrs.pp.toFixed(2)}**PP for **${FcAcc}%**)`
			} else {
				pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`
			}

			const mapValues = calc.mapAttributes(map)

			let Hit, Total
			if (ModsName.toLowerCase().includes("dt")) {
				Hit = (hitLength / 1.5).toFixed()
				Total = (totalLength / 1.5).toFixed()
			} else {
				Hit = hitLength
				Total = totalLength
			}

			let minutesHit = Math.floor(Hit / 60)
			let secondsHit = (Hit % 60).toString().padStart(2, "0")
			let minutesTotal = Math.floor(Total / 60)
			let secondsTotal = (Total % 60).toString().padStart(2, "0")

			first_row = `__**Personal Best #${Play_rank}:**__\n`
			second_row = `${grade} ** +${ModsName}** • ${score.score.toLocaleString()} • **${acc} ${sc_rank}**\n`
			third_row = `${pps}\n`
			fourth_row = `[**${score.max_combo}**x/${CurAttrs.difficulty.maxCombo}x] • ${AccValues}\n`
			fifth_row = `Score Set <t:${ScoreSetTime}:R>`

			title = Title
			url = `https://osu.ppy.sh/b/${score.beatmap.id}`
			fields = { name: `**Beatmap info:**`, value: `BPM: \`${mapValues.bpm.toFixed()}\` Objects: \`${objects.toLocaleString()}\` Length: \`${minutesTotal}:${secondsTotal}\` (\`${minutesHit}:${secondsHit}\`)\nAR: \`${mapValues.ar.toFixed(1).toString().replace(/\.0+$/, "")}\` OD: \`${mapValues.od.toFixed(1).toString().replace(/\.0+$/, "")}\` CS: \`${mapValues.cs.toFixed(1).toString().replace(/\.0+$/, "")}\` HP: \`${mapValues.hp.toFixed(2).toString().replace(/\.0+$/, "")}\`` }
			footer = { text: `${status} map by ${creator} | osu!${server}`, iconURL: `https://a.ppy.sh/${creator_id}?1668890819.jpeg` }
		}

		rows = `${first_row}${second_row}${third_row}${fourth_row}${fifth_row}`

		return { rows, title, url, fields, footer }
	}

	let thing1 = "**No scores found.**"
	let thing2 = ""
	let thing3 = ""
	let thing4 = ""
	let thing5 = ""

	if (play_number) {
		if (play_number > score.length) {
			const embed = new EmbedBuilder().setColor("Purple").setDescription(`Please provide a number not greater than ${score.length}`)
			return embed
		}

		let setId
		if (server == "bancho") setId = score[play_number - 1].beatmapset.id
		if (server == "gatari") setId = score[play_number - 1].beatmap.beatmapset_id

		const scoreinfo = await ScoreGet(score[play_number - 1])

		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username} ${user_pp}pp (#${global_rank} ${country}#${country_rank}) `,
				iconURL: `https://osu.ppy.sh/images/flags/${country}.png`,
				url: `https://osu.ppy.sh/users/${user.id}`,
			})
			.setTitle(scoreinfo.title)
			.setURL(scoreinfo.url)
			.setDescription(scoreinfo.rows)
			.setFields(scoreinfo.fields)
			.setThumbnail(`https://assets.ppy.sh/beatmaps/${setId}/covers/list.jpg`)
			.setFooter(scoreinfo.footer)

		return embed
	}
	const TotalPage = Math.ceil(score.length / 5)

	if (pageNumber > TotalPage) {
		const embed = new EmbedBuilder().setColor("Purple").setDescription(`Please provide a value not greater than ${TotalPage}`)
		return embed
	}

	if (score[one]) thing1 = `${await (await ScoreGet(score[one])).rows}\n`
	if (score[two]) thing2 = `${await (await ScoreGet(score[two])).rows}\n`
	if (score[three]) thing3 = `${await (await ScoreGet(score[three])).rows}\n`
	if (score[four]) thing4 = `${await (await ScoreGet(score[four])).rows}\n`
	if (score[five]) thing5 = `${await (await ScoreGet(score[five])).rows}\n`

	const embed = new EmbedBuilder()
		.setColor("Purple")
		.setAuthor({
			name: `${user.username}: ${user_pp}pp (#${global_rank} ${country}#${country_rank})`,
			iconURL: `https://osu.ppy.sh/images/flags/${country}.png`,
			url: `https://osu.ppy.sh/users/${user.id}/${ModeOsu}`,
		})
		.setThumbnail(useravatar)
		.setDescription(`${thing1}${thing2}${thing3}${thing4}${thing5}`)
		.setFooter({ text: `Page ${pageNumber}/${TotalPage} | osu!${server}` })
	return embed
}

module.exports = { GetUserTop }
