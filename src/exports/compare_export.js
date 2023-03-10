const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const { v2, auth, tools, mods } = require("osu-api-extended")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")

async function CompareEmbed(mapinfo, beatmapId, user, ModeString, value, pagenum) {
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

	try {
		try {
			// formatted values for user
			global_rank = user.statistics.global_rank.toLocaleString()
			country_rank = user.statistics.country_rank.toLocaleString()
			user_pp = user.statistics.pp.toLocaleString()
		} catch (err) {
			global_rank = 0
			country_rank = 0
			user_pp = 0
		}

		let status = mapinfo.status.charAt(0).toUpperCase() + mapinfo.status.slice(1)

		// score set
		const scr = await v2.user.scores.beatmap.all(beatmapId, user.id, ModeString)

		let score
		try {
			score = scr.scores.sort((a, b) => b.pp - a.pp)
			if (score == undefined) throw new Error("unranked")
		} catch (err) {
			const embed = new EmbedBuilder()
				.setColor("Purple")
				.setAuthor({
					name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
					iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
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

		if (!fs.existsSync(`./osuFiles/${beatmapId}.osu`)) {
			console.log("no file.")
			const downloader = new Downloader({
				rootPath: "./osuFiles",

				filesPerSecond: 0,
			})

			downloader.addSingleEntry(beatmapId)
			await downloader.downloadSingle()
		}
		let map = new Beatmap({ path: `./osuFiles/${beatmapId}.osu` })
		let objects1 = mapinfo.count_circles + mapinfo.count_sliders + mapinfo.count_spinners

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
		const pagenum = Math.ceil(pagenumraw)

		let pageCount = ``
		pageCount = `**Page:** \`${one + 1}/${pagenum}\``

		async function GetCompareList(score, num) {
			let modsone = score.mods.join("")
			let modsID
			if (!modsone.length) {
				modsone = "NM"
				modsID = 0
			} else {
				modsID = mods.id(modsone)
			}

			let scoreParam = {
				mode: 0,
			}

			let calc = new Calculator(scoreParam)

			// ss pp
			let maxAttrs1 = calc.mods(modsID).performance(map)

			//normal pp
			let CurAttrs1 = calc.n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nMisses(Number(score.statistics.count_miss)).combo(score.max_combo).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).mods(modsID).performance(map)

			//fc pp
			let FCAttrs1 = calc.n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nMisses(0).combo(maxAttrs1.difficulty.maxCombo).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).performance(map)

			// score set at
			time1 = new Date(score.created_at).getTime() / 1000

			pps = `**${CurAttrs1.pp.toFixed(2)}**/${maxAttrs1.pp.toFixed(2)}PP`
			if (CurAttrs1.effectiveMissCount > 0) {
				Map300CountFc = objects1 - score.statistics.count_100 - score.statistics.count_50

				const FcAcc = tools.accuracy({
					300: Map300CountFc,
					geki: score.statistics.count_geki,
					100: score.statistics.count_100,
					katu: score.statistics.count_katu,
					50: score.statistics.count_50,
					0: 0,
					mode: ModeString,
				})
				pps = `**${CurAttrs1.pp.toFixed(2)}**/${maxAttrs1.pp.toFixed(2)}PP ▹ (**${FCAttrs1.pp.toFixed(2)}**PP for **${FcAcc}%**)`
			}

			if (score.mode_int == "0") AccValues = `{**${score.statistics.count_300}**/${score.statistics.count_100}/${score.statistics.count_50}/${score.statistics.count_miss}}`
			if (score.mode_int == "1") AccValues = `{**${score.statistics.count_300}**/${score.statistics.count_100}}/${score.statistics.count_miss}}`
			if (score.mode_int == "2") AccValues = `{**${score.statistics.count_300}**/${score.statistics.count_100}/${score.statistics.count_50}/${score.statistics.count_miss}}`
			if (score.mode_int == "3") AccValues = `{**${score.statistics.count_geki}**/${score.statistics.count_300}/${score.statistics.count_katu}/${score.statistics.count_100}/${score.statistics.count_50}/${score.statistics.count_miss}}`

			let grade = score.rank
			grade = grades[grade]

			const row_one = `**${num + 1}.**${grade} \`+${modsone}\` **[${maxAttrs1.difficulty.stars.toFixed(2)}★]** ∙ ${score.score.toLocaleString()} ∙ (${(score.accuracy * 100).toFixed(2)}%)\n`
			const row_two = `▹${pps}\n`
			const row_three = `▹[**${score.max_combo}**x/${FCAttrs1.difficulty.maxCombo}x] ∙ ${AccValues} <t:${time1}:R>`

			return `${row_one}${row_two}${row_three}`
		}

		if (score[one]) thing1 = `${await GetCompareList(score[one], one)}\n`
		if (score[two]) thing2 = `${await GetCompareList(score[two], two)}\n`
		if (score[three]) thing3 = `${await GetCompareList(score[three], three)}\n`
		if (score[four]) thing4 = `${await GetCompareList(score[four], four)}\n`
		if (score[five]) thing5 = `${await GetCompareList(score[five], five)}\n`

		Score = `${thing1}${thing2}${thing3}${thing4}${thing5}${pageCount}`
		if (value) {
			thing1 = `${await GetCompareList(score[value], value)}\n`
			Score = `${thing1}`
		}

		//embed
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
				iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
				url: `https://osu.ppy.sh/users/${user.id}`,
			})
			.setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}]`)
			.setDescription(Score)
			.setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
			.setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
			.setThumbnail(user.avatar_url)
			.setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` })

		return embed
	} catch (err) {
		console.log(err)
	}
}

module.exports = { CompareEmbed }
