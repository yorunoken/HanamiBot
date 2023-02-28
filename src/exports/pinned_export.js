const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const { v2, auth, tools, mods } = require("osu-api-extended")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")

async function GetPinned(value, user, mode, RuleSetId, pageNumber) {
	await auth.login(process.env.client_id, process.env.client_secret)

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

	const pin = await v2.user.scores.category(user.id, "pinned", {
		mode: mode,
		limit: "100",
		offset: "0",
	})

	async function Pinget(pin, num) {
		if (!fs.existsSync(`./osuFiles/${pin.beatmap.id}.osu`)) {
			console.log("no file.")
			const downloader = new Downloader({
				rootPath: "./osuFiles",

				filesPerSecond: 0,
			})

			downloader.addSingleEntry(pin.beatmap.id)
			await downloader.downloadSingle()
		}

		let grade = pin.rank
		grade = grades[grade]

		let Mods = "NM"
		if (pin.mods.length != 0) Mods = `${pin.mods}`

		const modsID = mods.id(Mods)
		let scoreParam = {
			mode: RuleSetId,
			mods: modsID,
		}

		let map = new Beatmap({ path: `./osuFiles/${pin.beatmap.id}.osu` })
		let calc = new Calculator(scoreParam)

		const Star = calc.performance(map)

		let pp = "❤️"
		if (pin.pp != null) pp = `**${pin.pp.toFixed(2)}PP**`
		const acc = `${(100 * pin.accuracy).toFixed(2)}%`
		const time_set = `<t:${new Date(pin.created_at).getTime() / 1000}:R>`

		let AccValues
		if (pin.mode_int == "0") AccValues = `{**${pin.statistics.count_300}**/${pin.statistics.count_100}/${pin.statistics.count_50}/${pin.statistics.count_miss}}`
		if (pin.mode_int == "1") AccValues = `{**${pin.statistics.count_300}**/${pin.statistics.count_100}}/${pin.statistics.count_miss}}`
		if (pin.mode_int == "2") AccValues = `{**${pin.statistics.count_300}**/${pin.statistics.count_100}/${pin.statistics.count_50}/${pin.statistics.count_miss}}`
		if (pin.mode_int == "3") AccValues = `{**${pin.statistics.count_geki}/${pin.statistics.count_300}**/${pin.statistics.count_katu}/${pin.statistics.count_100}/${pin.statistics.count_50}/${pin.statistics.count_miss}}`

		const first_row = `**${num + 1}. [${pin.beatmapset.title} [${pin.beatmap.version}]](https://osu.ppy.sh/b/${pin.beatmap.id}) +${Mods}** [${Star.difficulty.stars.toFixed(2)}★]\n`
		const second_row = `${grade} ${pp} ▹ (${acc}) ▹ [**${pin.max_combo}**/${Star.difficulty.maxCombo}x]\n`
		const third_row = `${pin.score.toLocaleString()} ▹ ${AccValues} ${time_set}`
		return `${first_row}${second_row}${third_row}`
	}

	if (value > 0) {
		console.log("value has been detected,", value)
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username} ${user.statistics.pp.toLocaleString()}pp (#${user.statistics.global_rank.toLocaleString()} ${user.country_code}#${user.statistics.country_rank.toLocaleString()}) `,
				iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
				url: `https://osu.ppy.sh/users/${user.id}`,
			})
			.setThumbnail(user.avatar_url)
			.setDescription(Pinget(value, value + 1))

		const total_pinned = 1

		return { embed, total_pinned }
	}

	pin_one = "**No pinned plays found**"
	if (pin[one]) pin_one = `${await Pinget(pin[one], one)}\n`

	pin_two = ""
	if (pin[two]) pin_two = `${await Pinget(pin[two], two)}\n`

	pin_three = ""
	if (pin[three]) pin_three = `${await Pinget(pin[three], three)}\n`

	pin_four = ""
	if (pin[four]) pin_four = `${await Pinget(pin[four], four)}\n`

	pin_five = ""
	if (pin[five]) pin_five = `${await Pinget(pin[five], five)}`

	const embed = new EmbedBuilder()
		.setColor("Purple")
		.setAuthor({
			name: `${user.username} ${user.statistics.pp.toLocaleString()}pp (#${user.statistics.global_rank.toLocaleString()} ${user.country_code}#${user.statistics.country_rank.toLocaleString()}) `,
			iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
			url: `https://osu.ppy.sh/users/${user.id}`,
		})
		.setThumbnail(user.avatar_url)
		.setDescription(`${pin_one}${pin_two}${pin_three}${pin_four}${pin_five}`)
		.setFooter({ text: `Page ${pageNumber}/${Math.ceil(pin.length / 5)}` })

	const total_pinned = pin.length

	return { embed, total_pinned }
}

module.exports = { GetPinned }
