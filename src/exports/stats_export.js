const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")
const { mods } = require("osu-api-extended")
const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const Table = require("easy-table")

async function GetUserTop100Stats(user, tops, ruleset, mode) {
	try {
		global_rank = user.statistics.global_rank.toLocaleString()
		country_rank = user.statistics.country_rank.toLocaleString()
		pp = user.statistics.pp.toLocaleString()
	} catch (err) {
		global_rank = "0"
		country_rank = "0"
		pp = "0"
	}

	let Attrs = []
	let MapDifficulty = []
	let PlayedMods = []
	let RawMappers = []
	for (let i = 0; i < tops.length; i++) {
		const score = tops[i]

		if (!fs.existsSync(`./osuFiles/${score.beatmap.id}.osu`)) {
			console.log(`no file, ${i}`)
			const downloader = new Downloader({
				rootPath: "./osuFiles",

				filesPerSecond: 0,
			})

			downloader.addSingleEntry(score.beatmap.id)
			await downloader.downloadSingle()
		}
		let modsID = mods.id(score.mods.join(""))
		if (!score.mods.join("").length) modsID = 0

		let scoreParam = {
			mode: ruleset,
			mods: modsID,
		}

		let map = new Beatmap({ path: `./osuFiles/${score.beatmap.id}.osu` })

		const mapValues = new Calculator(scoreParam).mapAttributes(map)
		const ppfc = new Calculator(scoreParam).n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).performance(map)

		let UsedMods = score.mods.join("")
		if (UsedMods.length == 0) UsedMods = "NM"

		Attrs.push(ppfc)
		MapDifficulty.push(mapValues)
		PlayedMods.push(UsedMods)
		RawMappers.push(score.beatmapset.creator)
	}

	const acc = tops.map(x => x.accuracy * 100)
	const combo = tops.map(x => x.max_combo)
	const miss = tops.map(x => x.statistics.count_miss)
	const pps = tops.map(x => x.pp)
	const ppfc = Attrs.map(x => x.pp)
	const star = Attrs.map(x => x.difficulty.stars)
	const bpm = MapDifficulty.map(x => x.bpm)
	const ar = MapDifficulty.map(x => x.ar)
	const od = MapDifficulty.map(x => x.od)
	const cs = MapDifficulty.map(x => x.cs)
	const hp = MapDifficulty.map(x => x.hp)

	const modCounts = []

	for (let mod of PlayedMods) {
		let index = modCounts.findIndex(element => element.mod === mod)
		if (index !== -1) {
			modCounts[index].count++
		} else {
			modCounts.push({ mod: mod, count: 1 })
		}
	}

	modCounts.sort((a, b) => b.count - a.count)
	const FirstSixMods = modCounts.slice(0, 6)

	let FavMods = ""
	for (let modCount of FirstSixMods) {
		FavMods += `\`${modCount.mod}: ${modCount.count}\`\n`
	}

	const MappersCount = []

	for (let mapper of RawMappers) {
		let index = MappersCount.findIndex(element => element.mapper === mapper)
		if (index !== -1) {
			MappersCount[index].count++
		} else {
			MappersCount.push({ mapper: mapper, count: 1 })
		}
	}

	MappersCount.sort((a, b) => b.count - a.count)

	const FirstSixMappers = MappersCount.slice(0, 6)

	let FavMapper = ""
	for (let Mapper of FirstSixMappers) {
		FavMapper += `\`${Mapper.mapper}: ${Mapper.count}\`\n`
	}

	function GetMinAvgMax(array) {
		const avg = Number((array.reduce((Array, num) => Array + parseFloat(num), 0) / array.length).toFixed(2))
		const min = Number(Math.min.apply(null, array).toFixed(2))
		const max = Number(Math.max.apply(null, array).toFixed(2))
		return { avg, min, max }
	}

	const data = [
		{ name: "Stars", min: GetMinAvgMax(star).min, avg: GetMinAvgMax(star).avg, max: GetMinAvgMax(star).max },
		{ name: "Accuracy", min: GetMinAvgMax(acc).min, avg: GetMinAvgMax(acc).avg, max: GetMinAvgMax(acc).max },
		{ name: "Combo", min: GetMinAvgMax(combo).min.toFixed(), avg: GetMinAvgMax(combo).avg.toFixed(), max: GetMinAvgMax(combo).max.toFixed() },
		{ name: "PP", min: GetMinAvgMax(pps).min, avg: GetMinAvgMax(pps).avg, max: GetMinAvgMax(pps).max },
		{ name: "PP FC", min: GetMinAvgMax(ppfc).min, avg: GetMinAvgMax(ppfc).avg, max: GetMinAvgMax(ppfc).max },
		{ name: "Miss", min: GetMinAvgMax(miss).min, avg: GetMinAvgMax(miss).avg, max: GetMinAvgMax(miss).max },
		{ name: "BPM", min: GetMinAvgMax(bpm).min, avg: GetMinAvgMax(bpm).avg, max: GetMinAvgMax(bpm).max },
		{ name: "AR", min: GetMinAvgMax(ar).min, avg: GetMinAvgMax(ar).avg, max: GetMinAvgMax(ar).max },
		{ name: "OD", min: GetMinAvgMax(od).min, avg: GetMinAvgMax(od).avg, max: GetMinAvgMax(od).max },
		{ name: "CS", min: GetMinAvgMax(cs).min, avg: GetMinAvgMax(cs).avg, max: GetMinAvgMax(cs).max },
		{ name: "HP", min: GetMinAvgMax(hp).min, avg: GetMinAvgMax(hp).avg, max: GetMinAvgMax(hp).max },
	]

	const t = new Table()
	data.forEach(function (Skills) {
		t.cell("", Skills.name)
		t.cell("Minimum", Skills.min)
		t.cell("Average", Skills.avg)
		t.cell("Maximum", Skills.max)
		t.newRow()
	})

	return new EmbedBuilder()
		.setColor("Purple")
		.setAuthor({
			name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
			iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
			url: `https://osu.ppy.sh/users/${user.id}/${mode}`,
		})
		.setThumbnail(user.avatar_url)
		.setFields({ name: `Performance Spread:`, value: `\`\`\`${t.toString()}\`\`\``, inline: false }, { name: `Top Mod Combos:`, value: `${FavMods}`, inline: true }, { name: `Top Mappers:`, value: `${FavMapper}`, inline: true })
}

module.exports = { GetUserTop100Stats }
