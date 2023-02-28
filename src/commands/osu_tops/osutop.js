const { EmbedBuilder } = require("discord.js")
const fs = require("fs")
const { v2, auth, tools, mods } = require("osu-api-extended")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
		} else {
			const userData = JSON.parse(data)
			value = 1
			play_number = undefined
			let ModeOsu
			let string = args.join(" ").match(/"(.*?)"/)
			try {
				ModeOsu = userData[message.author.id].osumode
				if (ModeOsu == undefined) ModeOsu = "osu"
			} catch (err) {
				ModeOsu = "osu"
			}
			ModeID = 0

			if (message.mentions.users.size > 0) {
				const mentionedUser = message.mentions.users.first()
				try {
					if (mentionedUser) {
						if (message.content.includes(`<@${mentionedUser.id}>`)) {
							userargs = userData[mentionedUser.id].osuUsername
						} else {
							userargs = userData[message.author.id].osuUsername
						}
					}
				} catch (err) {
					console.error(err)
					if (mentionedUser) {
						if (message.content.includes(`<@${mentionedUser.id}>`)) {
							try {
								userargs = userData[mentionedUser.id].osuUsername
							} catch (err) {
								message.reply(`No osu! user found for ${mentionedUser.tag}`)
							}
						} else {
							try {
								userargs = userData[message.author.id].osuUsername
							} catch (err) {
								message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
							}
						}
					}
					return
				}
			} else {
				if (args[0] === undefined) {
					try {
						userargs = userData[message.author.id].osuUsername
					} catch (err) {
						console.error(err)
						message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
						return
					}
				} else {
					if (args.includes("-i")) {
						singleArgument = args.slice(0, args.indexOf("-i")).join(" ")
						const iIndex = args.indexOf("-i")
						play_number = args[iIndex + 1]
						userargs = singleArgument
					} else if (args.includes("-p")) {
						singleArgument = args.slice(0, args.indexOf("-p")).join(" ")
						const iIndex = args.indexOf("-p")
						value = args[iIndex + 1]
						userargs = singleArgument
					} else {
						singleArgument = args.join(" ")
						value = 1
						userargs = singleArgument
					}

					if (value > 20) {
						message.reply(`**Value must not be greater than 20**`)
						return
					}
					if (play_number > 100) {
						message.reply(`**Value must not be greater than 100**`)
						return
					}

					if (string) {
						userargs = string[1]
					} else {
						userargs = args[0]
					}
				}
			}

			if (args.includes("-mania")) {
				ModeID = 3
				ModeOsu = "mania"
			}
			if (args.join(" ").startsWith("-mania"))
				try {
					userargs = userData[message.author.id].osuUsername
				} catch (err) {
					message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
					return
				}

			if (args.includes("-osu")) {
				ModeID = 0
				ModeOsu = "osu"
			}
			if (args.join(" ").startsWith("-osu"))
				try {
					userargs = userData[message.author.id].osuUsername
				} catch (err) {
					message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
					return
				}

			if (args.includes("-taiko")) {
				ModeID = 1
				ModeOsu = "taiko"
			}
			if (args.join(" ").startsWith("-taiko"))
				try {
					userargs = userData[message.author.id].osuUsername
				} catch (err) {
					message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
					return
				}

			if (args.includes("-ctb")) {
				ModeID = 2
				ModeOsu = "ctb"
			}
			if (args.join(" ").startsWith("-ctb"))
				try {
					userargs = userData[message.author.id].osuUsername
				} catch (err) {
					message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
					return
				}

			if (args.join(" ").startsWith("-i") || args.join(" ").startsWith("mods") || args.join(" ").startsWith("+") || args.join(" ").startsWith("-g") || args.join(" ").startsWith("-am") || args.join(" ").startsWith("-amount")) {
				try {
					try {
						userargs = userData[message.author.id].osuUsername
					} catch (err) {
						message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
					}
				} catch (err) {
					message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
					return
				}
			}

			let argValues = {}
			for (const arg of args) {
				const [key, value] = arg.split("=")
				argValues[key] = value
			}

			let filteredscore
			let FilterMods = ""
			sortmod = 0

			//log into api
			await auth.login(process.env.client_id, process.env.client_secret)

			const user = await v2.user.details(userargs, ModeOsu)

			if (user.id == undefined) {
				message.reply(`**The user ${userargs} does not exist.**`)
				return
			}

			if (args.join(" ").includes("-am") || args.join(" ").includes("-g")) {
				if (args.join(" ").includes("-am")) query = "-am"
				if (args.join(" ").includes("-amount")) query = "-amount"
				if (args.join(" ").includes("-g")) query = "-g"

				const iIndex = args.indexOf(query)
				const GIndex = Number(args[iIndex + 1])

				//score set
				const score = await v2.user.scores.category(user.id, "best", {
					include_fails: "0",
					mode: ModeOsu,
					limit: "100",
					offset: "0",
				})

				const Number_bigger = score.filter(x => x.pp > GIndex)

				const embed = new EmbedBuilder().setColor("Purple").setDescription(`${user.username} has **\`${Number_bigger.length}\`** plays worth more than ${GIndex.toFixed(1)}PP`)

				message.channel.send({ embeds: [embed] })

				return
			}

			if (play_number) {
				let playNumber = Number(play_number)
				if (args[0] === "-i") {
					playNumber = Number(play_number)
					try {
						userargs = userData[message.author.id].osuUsername
					} catch (err) {
						message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
					}
				}

				//score set
				let score = await v2.user.scores.category(user.id, "best", {
					include_fails: "0",
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

				const play_rank_1 = scores.findIndex(play => play.id === score[playNumber - 1].id) + 1

				if (argValues["mods"] != undefined) {
					sortmod = 1
					filteredscore = score.filter(x => x.mods.join("").split("").sort().join("").toLowerCase() == argValues["mods"].split("").sort().join("").toLowerCase())
					score = filteredscore
					FilterMods = `**Filtering mod(s): ${score[value].mods.join("").toUpperCase()}**`
				}

				//formatted values for user
				try {
					global_rank = user.statistics.global_rank.toLocaleString()
					country_rank = user.statistics.country_rank.toLocaleString()
					user_pp = user.statistics.pp.toLocaleString()
				} catch (err) {
					global_rank = "0"
					country_rank = "0"
					user_pp = user.statistics.pp.toLocaleString()
				}

				//hits
				let three = score[playNumber - 1].statistics.count_300
				let one = score[playNumber - 1].statistics.count_100
				let fifty = score[playNumber - 1].statistics.count_50
				let miss = Number(score[playNumber - 1].statistics.count_miss)

				//rosu pp setup
				if (!fs.existsSync(`./osuFiles/${score[playNumber - 1].beatmap.id}.osu`)) {
					console.log("no file.")
					const downloader = new Downloader({
						rootPath: "./osuFiles",

						filesPerSecond: 0,
					})

					downloader.addSingleEntry(score[playNumber - 1].beatmap.id)
					await downloader.downloadSingle()
				}

				let modsone = score[playNumber - 1].mods.join("")
				let modsID = mods.id(modsone)

				if (!modsone.length) {
					modsone = "NM"
					modsID = 0
				}

				let scoreParam = {
					mode: ModeID,
					mods: modsID,
				}
				let map = new Beatmap({ path: `./osuFiles/${score[playNumber - 1].beatmap.id}.osu` })
				let calc = new Calculator(scoreParam)

				const mapValues = calc.mapAttributes(map)

				// ss pp
				let maxAttrs = calc.performance(map)

				//normal pp
				let CurAttrs = calc
					.n100(score[playNumber - 1].statistics.count_100)
					.n300(score[playNumber - 1].statistics.count_300)
					.n50(score[playNumber - 1].statistics.count_50)
					.nMisses(score[playNumber - 1].statistics.count_miss)
					.combo(score[playNumber - 1].max_combo)
					.nGeki(score[playNumber - 1].statistics.count_geki)
					.nKatu(score[playNumber - 1].statistics.count_katu)
					.performance(map)

				//fc pp
				let FCAttrs = calc
					.n100(score[playNumber - 1].statistics.count_100)
					.n300(score[playNumber - 1].statistics.count_300)
					.n50(score[playNumber - 1].statistics.count_50)
					.nMisses(0)
					.combo(maxAttrs.difficulty.maxCombo)
					.nGeki(score[playNumber - 1].statistics.count_geki)
					.nKatu(score[playNumber - 1].statistics.count_katu)
					.performance(map)

				//formatted values for score
				let map_score = score[playNumber - 1].score.toLocaleString()
				let acc = Number(score[playNumber - 1].accuracy * 100).toFixed(2)
				let beatmap_id = Number(score[playNumber - 1].beatmap.id)

				//score set at
				time1 = new Date(score[playNumber - 1].created_at).getTime() / 1000

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
				let grade = score[playNumber - 1].rank
				grade = grades[grade]

				let objects = score[playNumber - 1].beatmap.count_circles + score[playNumber - 1].beatmap.count_sliders + score[playNumber - 1].beatmap.count_spinners

				//set title
				let title = `${score[playNumber - 1].beatmapset.artist} - ${score[playNumber - 1].beatmapset.title} [${score[playNumber - 1].beatmap.version}] [${CurAttrs.difficulty.stars.toFixed(2)}★]`

				if (CurAttrs.effectiveMissCount > 0) {
					Map300CountFc = objects - score[playNumber - 1].statistics.count_100 - score[playNumber - 1].statistics.count_50

					const FcAcc = tools.accuracy({
						300: Map300CountFc,
						geki: score[playNumber - 1].statistics.count_geki,
						100: score[playNumber - 1].statistics.count_100,
						katu: score[playNumber - 1].statistics.count_katu,
						50: score[playNumber - 1].statistics.count_50,
						0: 0,
						mode: ModeOsu,
					})
					console.log(FcAcc)

					pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP ▹ (**${FCAttrs.pp.toFixed(2)}**PP for **${FcAcc}%**)`
				} else {
					pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`
				}

				//length
				let Hit = score[playNumber - 1].beatmap.hit_length
				let Total = score[playNumber - 1].beatmap.total_length

				let minutesHit = Math.floor(Hit / 60)
				let secondsHit = (Hit % 60).toString().padStart(2, "0")
				let minutesTotal = Math.floor(Total / 60)
				let secondsTotal = (Total % 60).toString().padStart(2, "0")

				let scorerank = await v2.scores.details(score[playNumber - 1].best_id, "osu")
				if (score[playNumber - 1].passed == true) {
					if (scorerank.rank_global != undefined) {
						sc_rank = ` 🌐 #${scorerank.rank_global}`
					} else {
						sc_rank = " "
					}
				} else if (score[playNumber - 1].passed == false) {
					sc_rank = " "
				}

				let status = score[playNumber - 1].beatmapset.status.charAt(0).toUpperCase() + score[playNumber - 1].beatmapset.status.slice(1)

				//score embed
				const embed = new EmbedBuilder()
					.setColor("Purple")
					.setAuthor({
						name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
						iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
						url: `https://osu.ppy.sh/users/${user.id}`,
					})
					.setTitle(title)
					.setURL(`https://osu.ppy.sh/b/${beatmap_id}`)
					.setDescription(`__**Personal Best #${play_rank_1}:**__\n${grade} ** +${modsone}** • ${map_score} • **(${acc}%) ${sc_rank}**\n${pps} \n[**${score[playNumber - 1].max_combo}**x/${CurAttrs.difficulty.maxCombo}x] • {**${three}**/${one}/${fifty}/${miss}}\nScore Set <t:${time1}:R>`)
					.setFields({ name: `**Beatmap info:**`, value: `BPM: \`${mapValues.bpm.toFixed()}\` Objects: \`${objects.toLocaleString()}\` Length: \`${minutesTotal}:${secondsTotal}\` (\`${minutesHit}:${secondsHit}\`)\nAR: \`${mapValues.ar.toFixed(1).toString().replace(/\.0+$/, "")}\` OD: \`${mapValues.od.toFixed(1).toString().replace(/\.0+$/, "")}\` CS: \`${mapValues.cs.toFixed(1).toString().replace(/\.0+$/, "")}\` HP: \`${mapValues.hp.toFixed(2).toString().replace(/\.0+$/, "")}\`` })
					.setThumbnail(`https://assets.ppy.sh/beatmaps/${score[playNumber - 1].beatmapset.id}/covers/list.jpg`)
					.setFooter({ text: `${status} map by ${score[playNumber - 1].beatmapset.creator}`, iconURL: `https://a.ppy.sh/${score[playNumber - 1].beatmapset.user_id}?1668890819.jpeg` })

				//send embed
				message.channel.send({ content: FilterMods, embeds: [embed] })
			} else {
				try {
					let pageNumber = Number(value)
					if (args === undefined) {
						pageNumber = Number("1")
					}
					if (args[0] === "-p") {
						pageNumber = Number(value)
						try {
							userargs = userData[message.author.id].osuUsername
						} catch (err) {
							message.reply(`Set your osu! username by using "${prefix}link **your username**"`)
						}
					}

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

					if (argValues["mods"] != undefined) {
						sortmod = 1
						filteredscore = score.filter(x => x.mods.join("").split("").sort().join("").toLowerCase() == argValues["mods"].split("").sort().join("").toLowerCase())
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

					let scoreone = "**No scores found.**"
					let scoretwo = ""
					let scorethree = ""
					let scorefour = ""
					let scorefive = ""

					if (score[one]) {
						const Play_rank1 = scores.findIndex(play => play.id === score[one].id) + 1

						if (!fs.existsSync(`./osuFiles/${score[one].beatmap.id}.osu`)) {
							console.log("no file.")
							const downloader = new Downloader({
								rootPath: "./osuFiles",

								filesPerSecond: 0,
							})

							downloader.addSingleEntry(score[one].beatmap.id)
							await downloader.downloadSingle()
						}

						let modsone = score[one].mods.join("")
						let modsID = mods.id(modsone)

						if (!modsone.length) {
							modsone = "NM"
							modsID = 0
						}

						let scoreParam = {
							mode: ModeID,
							mods: modsID,
						}

						let map = new Beatmap({ path: `./osuFiles/${score[one].beatmap.id}.osu` })
						let calc = new Calculator(scoreParam)

						let maxAttrs = calc.performance(map)
						console.log(calc.mapAttributes(map))

						let sr1 = maxAttrs.difficulty.stars.toFixed(2)
						let maxComboMap = maxAttrs.difficulty.maxCombo

						let grade = score[one].rank
						grade = grades[grade]

						time1 = new Date(score[one].created_at).getTime() / 1000

						scoreone = `**${Play_rank1}.** [**${score[one].beatmapset.title} [${score[one].beatmap.version}]**](https://osu.ppy.sh/b/${score[one].beatmap.id}) **+${modsone}** [${sr1}★]\n${grade} ▹ **${score[one].pp.toFixed(2)}PP** ▹ (${Number(score[one].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[one].max_combo)}x**/${maxComboMap}x]\n${score[one].score.toLocaleString()} ▹ [**${score[one].statistics.count_300}**/${score[one].statistics.count_100}/${score[one].statistics.count_50}/${score[one].statistics.count_miss}] <t:${time1}:R>\n`
					}

					if (score[two]) {
						const Play_rank2 = scores.findIndex(play => play.id === score[two].id) + 1

						if (!fs.existsSync(`./osuFiles/${score[two].beatmap.id}.osu`)) {
							console.log("no file.")
							const downloader = new Downloader({
								rootPath: "./osuFiles",

								filesPerSecond: 0,
							})

							downloader.addSingleEntry(score[two].beatmap.id)
							await downloader.downloadSingle()
						}

						let modstwo = score[two].mods.join("")
						let modsID = mods.id(modstwo)

						if (!modstwo.length) {
							modstwo = "NM"
							modsID = 0
						}

						let scoreParam = {
							mode: ModeID,
							mods: modsID,
						}

						let map = new Beatmap({ path: `./osuFiles/${score[two].beatmap.id}.osu` })
						let calc = new Calculator(scoreParam)
						let maxAttrs = calc.performance(map)
						let sr2 = maxAttrs.difficulty.stars.toFixed(2)
						let maxComboMap = maxAttrs.difficulty.maxCombo

						let gradetwo = score[two].rank
						gradetwo = grades[gradetwo]

						time2 = new Date(score[two].created_at).getTime() / 1000

						scoretwo = `**${Play_rank2}.** [**${score[two].beatmapset.title} [${score[two].beatmap.version}]**](https://osu.ppy.sh/b/${score[two].beatmap.id}) **+${modstwo}** [${sr2}★]\n${gradetwo} ▹ **${score[two].pp.toFixed(2)}PP** ▹ (${Number(score[two].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[two].max_combo)}x**/${maxComboMap}x]\n${score[two].score.toLocaleString()} ▹ [**${score[two].statistics.count_300}**/${score[two].statistics.count_100}/${score[two].statistics.count_50}/${score[two].statistics.count_miss}] <t:${time2}:R>\n`
					}

					if (score[three]) {
						const Play_rank3 = scores.findIndex(play => play.id === score[three].id) + 1

						if (!fs.existsSync(`./osuFiles/${score[three].beatmap.id}.osu`)) {
							console.log("no file.")
							const downloader = new Downloader({
								rootPath: "./osuFiles",

								filesPerSecond: 0,
							})

							downloader.addSingleEntry(score[three].beatmap.id)
							await downloader.downloadSingle()
						}

						let modsthree = score[three].mods.join("")
						let modsID = mods.id(modsthree)

						if (!modsthree.length) {
							modsthree = "NM"
							modsID = 0
						}

						let scoreParam = {
							mode: ModeID,
							mods: modsID,
						}

						let map = new Beatmap({ path: `./osuFiles/${score[three].beatmap.id}.osu` })
						let calc = new Calculator(scoreParam)
						let maxAttrs = calc.performance(map)
						let sr3 = maxAttrs.difficulty.stars.toFixed(2)
						let maxComboMap = maxAttrs.difficulty.maxCombo

						let gradethree = score[three].rank
						gradethree = grades[gradethree]

						time3 = new Date(score[three].created_at).getTime() / 1000

						scorethree = `**${Play_rank3}.** [**${score[three].beatmapset.title} [${score[three].beatmap.version}]**](https://osu.ppy.sh/b/${score[three].beatmap.id}) **+${modsthree}** [${sr3}★]\n${gradethree} ▹ **${score[three].pp.toFixed(2)}PP** ▹ (${Number(score[three].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[three].max_combo)}x**/${maxComboMap}x]\n${score[three].score.toLocaleString()} ▹ [**${score[three].statistics.count_300}**/${score[three].statistics.count_100}/${score[three].statistics.count_50}/${score[three].statistics.count_miss}] <t:${time3}:R>\n`
					}

					if (score[four]) {
						const Play_rank4 = scores.findIndex(play => play.id === score[four].id) + 1

						if (!fs.existsSync(`./osuFiles/${score[four].beatmap.id}.osu`)) {
							console.log("no file.")
							const downloader = new Downloader({
								rootPath: "./osuFiles",

								filesPerSecond: 0,
							})

							downloader.addSingleEntry(score[four].beatmap.id)
							await downloader.downloadSingle()
						}

						let modsfour = score[four].mods.join("")
						let modsID = mods.id(modsfour)

						if (!modsfour.length) {
							modsfour = "NM"
							modsID = 0
						}

						let scoreParam = {
							mode: ModeID,
							mods: modsID,
						}

						let map = new Beatmap({ path: `./osuFiles/${score[four].beatmap.id}.osu` })
						let calc = new Calculator(scoreParam)
						let maxAttrs = calc.performance(map)
						let sr4 = maxAttrs.difficulty.stars.toFixed(2)
						let maxComboMap = maxAttrs.difficulty.maxCombo

						let gradefour = score[four].rank
						gradefour = grades[gradefour]

						time4 = new Date(score[four].created_at).getTime() / 1000

						scorefour = `**${Play_rank4}.** [**${score[four].beatmapset.title} [${score[four].beatmap.version}]**](https://osu.ppy.sh/b/${score[four].beatmap.id}) **+${modsfour}** [${sr4}★]\n${gradefour} ▹ **${score[four].pp.toFixed(2)}PP** ▹ (${Number(score[four].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[four].max_combo)}x**/${maxComboMap}x]\n${score[four].score.toLocaleString()} ▹ [**${score[four].statistics.count_300}**/${score[four].statistics.count_100}/${score[four].statistics.count_50}/${score[four].statistics.count_miss}] <t:${time4}:R>\n`
					}

					if (score[five]) {
						const Play_rank5 = scores.findIndex(play => play.id === score[five].id) + 1

						if (!fs.existsSync(`./osuFiles/${score[five].beatmap.id}.osu`)) {
							console.log("no file.")
							const downloader = new Downloader({
								rootPath: "./osuFiles",

								filesPerSecond: 0,
							})

							downloader.addSingleEntry(score[five].beatmap.id)
							await downloader.downloadSingle()
						}

						let modsfive = score[five].mods.join("")
						let modsID = mods.id(modsfive)

						if (!modsfive.length) {
							modsfive = "NM"
							modsID = 0
						}

						let scoreParam = {
							mode: ModeID,
							mods: modsID,
						}

						let map = new Beatmap({ path: `./osuFiles/${score[five].beatmap.id}.osu` })
						let calc = new Calculator(scoreParam)
						let maxAttrs = calc.performance(map)
						let sr5 = maxAttrs.difficulty.stars.toFixed(2)
						let maxComboMap = maxAttrs.difficulty.maxCombo

						let gradefive = score[five].rank
						gradefive = grades[gradefive]

						time5 = new Date(score[five].created_at).getTime() / 1000

						scorefive = `**${Play_rank5}.** [**${score[five].beatmapset.title} [${score[five].beatmap.version}]**](https://osu.ppy.sh/b/${score[five].beatmap.id}) **+${modsfive}** [${sr5}★]\n${gradefive} ▹ **${score[five].pp.toFixed(2)}PP** ▹ (${Number(score[five].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[five].max_combo)}x**/${maxComboMap}x]\n${score[five].score.toLocaleString()} ▹ [**${score[five].statistics.count_300}**/${score[five].statistics.count_100}/${score[five].statistics.count_50}/${score[five].statistics.count_miss}] <t:${time5}:R>`
					}

					const TotalPage = Math.ceil(score.length / 5)

					//embed
					const embed = new EmbedBuilder()
						.setColor("Purple")
						.setAuthor({
							name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
							iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
							url: `https://osu.ppy.sh/users/${user.id}/${ModeOsu}`,
						})
						.setThumbnail(user.avatar_url)
						.setDescription(`${scoreone}${scoretwo}${scorethree}${scorefour}${scorefive}`)
						.setFooter({ text: `Page ${pageNumber}/${TotalPage}` })

					message.channel.send({ content: FilterMods, embeds: [embed] })
				} catch (err) {
					//catch errors
					console.error(err)
					message.reply(`**There was an error. Check for spelling.**`)
				}
			}
		}
	})
}
exports.name = ["osutop"]
exports.aliases = ["top", "osutop", "t"]
exports.description = ["Displays user's top plays\n\n**Parameters:**\n`username` get the top plays of a user (must be first parameter) \n`-i (int)` get a specific play (1-100)\n`-p` get a specific page (1-20)"]
exports.usage = [`osutop whitecat -i 7\nosutop chocomint -p 4`]
exports.category = ["osu"]
