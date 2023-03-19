const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const axios = require("axios")
const { v2, auth, tools, mods } = require("osu-api-extended")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")

async function CompareEmbed(mapinfo, beatmapId, user, ModeString, value, pagenum, server, userstats) {
	await auth.login(process.env.client_id, process.env.client_secret)

	// determine the page of the compare
	const start = (pagenum - 1) * 5 + 1
	const end = pagenum * 5
	const numbers = []
	for (let i = start; i <= end; i++) {
		numbers.push(i)
	}
	one = numbers[0] - 1
	two = numbers[1] - 1
	three = numbers[2] - 1
	four = numbers[3] - 1
	five = numbers[4] - 1

	let score
	let RuleSetId = mapinfo.mode_int

	if (server == "bancho") {
		try {
			// formatted values for user
			global_rank = user.statistics.global_rank.toLocaleString()
			country_rank = user.statistics.country_rank.toLocaleString()
		} catch (err) {
			global_rank = 0
			country_rank = 0
		}
		user_pp = user.statistics.pp.toLocaleString()

		let scr = await v2.user.scores.beatmap.all(beatmapId, user.id, ModeString)
		try {
			score = scr.scores.sort((a, b) => b.pp - a.pp)
			if (score == undefined) throw new Error("unranked")
		} catch (err) {
			const embed = new EmbedBuilder()
				.setColor("Purple")
				.setAuthor({
					name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
					iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
					url: `https://osu.ppy.sh/users/${user.id}`,
				})
				.setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}] [${maxAttrs.difficulty.stars.toFixed(2)}★]`)
				.setDescription("**No scores found**")
				.setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
				.setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
				.setThumbnail(user.avatar_url)
				.setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` })

			message.channel.send({ embeds: [embed] })
		}

		CountryCode = user.country_code
		profileUrl = `https://osu.ppy.sh/users/${user.id}/${ModeString}`
		avatarUrl = user.avatar_url
	}

	if (server == "gatari") {
		value = 1
		var url = `https://api.gatari.pw/beatmap/user/score`
		const response = await axios.get(`${url}?b=${mapinfo.id}&u=${user.id}&mode=${RuleSetId}`)

		score = response.data.score
		if (score == null) {
			let embed = new EmbedBuilder().setColor("Purple").setDescription(`No recent Gatari plays found for **${user.username}**`)
			return { embed, FilterMods }
		}

		try {
			global_rank = userstats.rank.toLocaleString()
			country_rank = userstats.country_rank.toLocaleString()
		} catch (err) {
			global_rank = 0
			country_rank = 0
		}
		user_pp = userstats.pp.toLocaleString()
		CountryCode = user.country
		profileUrl = `https://osu.gatari.pw/u/${user.id}?m=${RuleSetId}`
		avatarUrl = `https://a.gatari.pw/${user.id}`
	}

	let status = mapinfo.status.charAt(0).toUpperCase() + mapinfo.status.slice(1)

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
	let objects = mapinfo.count_circles + mapinfo.count_sliders + mapinfo.count_spinners

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

	let thing1 = "**No scores**"
	let thing2 = ""
	let thing3 = ""
	let thing4 = ""
	let thing5 = ""
	let Score

	const pagenumraw = score.length / 5
	const PageCounter = Math.ceil(pagenumraw)

	let pageCount = ``
	if (PageCounter > 0) pageCount = `**Page:** \`${one + 1}/${PageCounter}\``

	async function GetCompareList(score, num) {
		let Mods, modsID, acc, ScoreSetAt
		if (server == "bancho") {
			count_geki = score.statistics.count_geki
			count_300 = score.statistics.count_300
			count_katu = score.statistics.count_katu
			count_100 = score.statistics.count_100
			count_50 = score.statistics.count_50
			count_miss = score.statistics.count_miss

			acc = `(${(score.accuracy * 100).toFixed(2)}%)`
			ScoreSetAt = new Date(score.created_at).getTime() / 1000
			modeint = modeint = score.mode_int

			Mods = score.mods.join("")
			modsID
			if (!Mods.length) {
				Mods = "NM"
				modsID = 0
			} else {
				modsID = mods.id(Mods)
			}
		}
		if (server == "gatari") {
			count_geki = score.count_geki || 0
			count_300 = score.count_300 || 0
			count_katu = score.count_katu || 0
			count_100 = score.count_100 || 0
			count_50 = score.count_50 || 0
			count_miss = score.count_miss || 0

			acc = `(${score.accuracy.toFixed(2)}%)`
			ScoreSetAt = new Date(score.time).getTime()

			modeint = score.play_mode

			modsID = score.mods
			Mods = mods.name(modsID)
		}

		let scoreParam = {
			mode: RuleSetId,
		}

		let calc = new Calculator(scoreParam)

		// ss pp
		let maxAttrs = calc.mods(modsID).performance(map)

		//normal pp
		let Attrs = calc.n100(count_100).n300(count_300).n50(count_50).nMisses(Number(count_miss)).combo(score.max_combo).nGeki(count_geki).nKatu(count_katu).mods(modsID).performance(map)

		//fc pp
		let FCAttrs = calc.n100(count_100).n300(count_300).n50(count_50).nMisses(0).combo(maxAttrs.difficulty.maxCombo).nGeki(count_geki).nKatu(count_katu).performance(map)

		pps = `**${Attrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`
		if (Attrs.effectiveMissCount > 0) {
			Map300CountFc = objects - count_100 - count_50

			const FcAcc = tools.accuracy({
				300: Map300CountFc,
				geki: count_geki,
				100: count_100,
				katu: count_katu,
				50: count_50,
				0: 0,
				mode: ModeString,
			})
			pps = `**${Attrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP ▹ (**${FCAttrs.pp.toFixed(2)}**PP for **${FcAcc}%**)`
		}

		if (modeint == "0") AccValues = `{**${count_300}**/${count_100}/${count_50}/${count_miss}}`
		if (modeint == "1") AccValues = `{**${count_300}**/${count_100}/${count_miss}}`
		if (modeint == "2") AccValues = `{**${count_300}**/${count_100}/${count_50}/${count_miss}}`
		if (modeint == "3") AccValues = `{**${count_geki}**/${count_300}/${count_katu}/${count_100}/${count_50}/${count_miss}}`

		let grade = score.rank
		grade = grades[grade]

		const row_one = `**${num + 1}.**${grade} \`+${Mods}\` **[${maxAttrs.difficulty.stars.toFixed(2)}★]** ∙ ${score.score.toLocaleString()} ∙ ${acc}\n`
		const row_two = `▹${pps}\n`
		const row_three = `▹[**${score.max_combo}**x/${mapinfo.max_combo}x] ∙ ${AccValues} <t:${ScoreSetAt}:R>`

		return `${row_one}${row_two}${row_three}`
	}

	if (score[one]) thing1 = `${await GetCompareList(score[one], one)}\n`
	if (score[two]) thing2 = `${await GetCompareList(score[two], two)}\n`
	if (score[three]) thing3 = `${await GetCompareList(score[three], three)}\n`
	if (score[four]) thing4 = `${await GetCompareList(score[four], four)}\n`
	if (score[five]) thing5 = `${await GetCompareList(score[five], five)}\n`

	Score = `${thing1}${thing2}${thing3}${thing4}${thing5}${pageCount}`
	if (value) {
		if ("gatari") {
			value = 0
			thing1 = `${await GetCompareList(score, value)}\n`
		} else {
			thing1 = `${await GetCompareList(score[value], value)}\n`
		}

		Score = `${thing1}`
	}

	//embed
	const embed = new EmbedBuilder()
		.setColor("Purple")
		.setAuthor({
			name: `${user.username} ${user_pp}pp (#${global_rank} ${CountryCode}#${country_rank}) `,
			iconURL: `https://osu.ppy.sh/images/flags/${CountryCode}.png`,
			url: `${profileUrl}`,
		})
		.setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}]`)
		.setDescription(Score)
		.setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
		.setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
		.setThumbnail(avatarUrl)
		.setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` })

	return embed
}

module.exports = { CompareEmbed }
