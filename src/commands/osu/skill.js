const fs = require("fs")
const { v2, auth, tools, mods } = require("osu-api-extended")
const { Beatmap, Calculator } = require("rosu-pp")
const { Downloader, DownloadEntry } = require("osu-downloader")
const { EmbedBuilder } = require("discord.js")

module.exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		let userargs

		let mode = "osu"
		let RuleSetId = 0

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
							message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
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
					message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
					return
				}
			} else {
				let string = args.join(" ").match(/"(.*?)"/)
				if (string) {
					userargs = string[1]
				} else {
					userargs = args[0]
				}
			}
		}

		if (userargs.length === 0) {
			try {
				userargs = userData[message.author.id].osuUsername
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
			}
		}

		//log in
		await auth.login(process.env.client_id, process.env.client_secret)
		const user = await v2.user.details(userargs, mode)
		if (user.id === undefined) {
			message.channel.send(`**The player, \`${userargs}\` does not exist**`)
			return
		}

		let stars = []
		let avgpp = []
		let miss = []
		async function CalculateSkill(scores, ruleset) {
			let acc = 0.0
			let aim = 0.0
			let speed = 0.0
			let weight_sum = 0.0

			const ACC_NERF = 1.3
			const AIM_NERF = 2.6
			const SPEED_NERF = 2.4

			for (let i = 0; i < scores.length; i++) {
				const score = scores[i]

				if (!fs.existsSync(`./osuBeatmapCache/${score.beatmap.id}.osu`)) {
					console.log(`no file, ${i}`)
					const downloader = new Downloader({
						rootPath: "./osuBeatmapCache",

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

				let map = new Beatmap({ path: `./osuBeatmapCache/${score.beatmap.id}.osu` })

				const pp = new Calculator(scoreParam).n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nMisses(Number(score.statistics.count_miss)).combo(score.max_combo).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).performance(map)

				stars.push(pp.difficulty.stars)
				avgpp.push(pp.pp)
				miss.push(score.statistics.count_miss)

				const acc_val = pp.ppAcc / ACC_NERF
				const aim_val = pp.ppAim / AIM_NERF
				const speed_val = pp.ppSpeed / SPEED_NERF
				const weight = 0.95 ** i

				acc += acc_val * weight
				aim += aim_val * weight
				speed += speed_val * weight
				weight_sum += weight
			}

			const map = value => Math.round(value * 100) / 100

			acc = map(acc / weight_sum)
			aim = map(aim / weight_sum)
			speed = map(speed / weight_sum)

			return { acc, aim, speed }
		}

		let plays = await v2.user.scores.category(user.id, "best", {
			include_fails: "0",
			mode: mode,
			limit: "100",
			offset: "0",
		})

		message.channel
			.send({ embeds: [new EmbedBuilder().setColor("Purple").setTitle("Calculating...").setDescription("Please sit still while I'm calculating your plays, this may take a while if it's your first time using this command.")] })
			.then(async msg => {
				//formatted values for user
				try {
					global_rank = user.statistics.global_rank.toLocaleString()
					country_rank = user.statistics.country_rank.toLocaleString()
				} catch (err) {
					global_rank = 0
					country_rank = 0
				}
				let user_pp = user.statistics.pp.toLocaleString()
				const values = await CalculateSkill(plays, RuleSetId)

				const starSum = stars.reduce((acc, num) => acc + parseFloat(num), 0) / stars.length
				const ppSum = avgpp.reduce((pp, num) => pp + parseFloat(num), 0) / avgpp.length
				const missSum = miss.reduce((miss, num) => miss + parseFloat(num), 0) / miss.length

				const embed = new EmbedBuilder()
					.setColor("Purple")
					.setAuthor({
						name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
						iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
						url: `https://osu.ppy.sh/users/${user.id}`,
					})
					.setFields({ name: `Average values`, value: `Average stars: \`${starSum.toFixed(2)}★\`\nAverage pp: \`${ppSum.toFixed(2)}\`\nAverage miss: \`${missSum.toFixed(2)}\`` }, { name: `Skills`, value: `Aim skill: \`${values.aim}\`\nAcc skill: \`${values.acc}\`\nSpeed skill:\`${values.speed}\`` })

				msg.edit({ embeds: [embed] })
			})
			.catch(err => {})
	})
}
exports.name = ["skill"]
exports.aliases = ["skill", "skills"]
exports.description = ["Displays user's average osu!standard skills\n\n**Parameters:**\n`username`"]
exports.usage = [`skill YoruNoKen`]
exports.category = ["osu"]
