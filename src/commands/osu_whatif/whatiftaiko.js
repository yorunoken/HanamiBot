const { EmbedBuilder } = require("discord.js")
const axios = require("axios")
const endpoint = `https://osudaily.net/api/`
const apiKey = process.env.osudaily_api
const fs = require("fs")
const { v2, auth } = require("osu-api-extended")

module.exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		let userargs

		let mode = "taiko"
		let RuleSetId = 1
		let mentioneduser = false

		if (message.mentions.users.size > 0) {
			const mentionedUser = message.mentions.users.first()
			try {
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						userargs = userData[mentionedUser.id].BanchoUserId
						mentioneduser = true
					} else {
						userargs = userData[message.author.id].BanchoUserId
					}
				}
			} catch (err) {
				console.error(err)
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						try {
							userargs = userData[mentionedUser.id].BanchoUserId
						} catch (err) {
							message.reply(`No osu! user found for ${mentionedUser.tag}`)
						}
					} else {
						try {
							userargs = userData[message.author.id].BanchoUserId
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
					userargs = userData[message.author.id].BanchoUserId
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

				if (args.includes("-mania")) {
					mode = "mania"
					RuleSetId = 3
				}
				if (args.includes("-taiko")) {
					mode = "taiko"
					RuleSetId = 1
				}
				if (args.includes("-ctb")) {
					mode = "fruits"
					RuleSetId = 2
				}

				if (args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-taiko")) {
					try {
						userargs = userData[message.author.id].BanchoUserId
					} catch (err) {
						message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
					}
				}
			}
		}

		if (userargs.length === 0 || (!isNaN(userargs) && !mentioneduser)) {
			try {
				userargs = userData[message.author.id].BanchoUserId
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
			}
		}

		console.log(userargs)

		//log in
		await auth.login(process.env.client_id, process.env.client_secret)

		let user = await v2.user.details(userargs, mode)
		if (user.id === undefined) {
			message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist**`)] })
			return
		}

		try {
			global_rank = user.statistics.global_rank.toLocaleString()
			country_rank = user.statistics.country_rank.toLocaleString()
			pp = user.statistics.pp.toLocaleString()
		} catch (err) {
			global_rank = "0"
			country_rank = "0"
			pp = "0"
		}

		const ppraw = Number(args[args.length - 1])
		if (ppraw == 0) {
			message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription("Value cannot be zero.")] })
			return
		}
		if (ppraw < 0) {
			message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription("Value cannot be less than zero.")] })
			return
		}
		if (isNaN(ppraw)) {
			message.channel.send({ embeds: [new EmbedBuilder().setTitle("Error!").setColor("Purple").setDescription(`**Please provide a value.**`).setFooter({ text: `Are you having issues with the formatting? remember that the username always comes first!` })] })
			return
		}

		let plays = await v2.user.scores.category(user.id, "best", {
			mode: mode,
			limit: "100",
			offset: "0",
		})
		let scores = plays.map(play => Number(play.pp))

		if (ppraw < scores[scores.length - 1])
			message.channel.send({
				embeds: [
					new EmbedBuilder()
						.setColor("Purple")
						.setAuthor({
							name: `${user.username} ${pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
							iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
							url: `https://osu.ppy.sh/users/${user.id}`,
						})
						.setTitle(`What if ${user.username} got a ${ppraw.toFixed(1)}pp score?`)
						.setThumbnail(user.avatar_url)
						.setDescription(`A **${ppraw.toFixed(2).toLocaleString()}pp** play would not be in ${user.username}'s top plays, meaning their pp would not change and they would not gain ranks.`),
				],
			})
		else {
			// apply weighting to the old scores and insert them to a new list

			scoresoldw = scores.map((score, index) => score * Math.pow(0.95, index))
			scores.pop()

			// add the hypothetical play to the list and sort it
			scores[scores.length] = ppraw
			scores.sort((a, b) => b - a)

			// apply weighting again with the new score in place
			weighedscores = []
			for (var i = 0; i < scores.length; i++) {
				weighedscores[weighedscores.length] = scores[i] * Math.pow(0.95, i)
			}

			// sum the score arrays
			totalppold = scoresoldw.reduce((a, b) => a + b, 0)
			totalpp = weighedscores.reduce((a, b) => a + b, 0)

			// calculate difference between the arrays and add it to the total pp
			difference = parseFloat(totalpp) - parseFloat(totalppold)
			newpp = parseFloat(user.statistics.pp) + parseFloat(difference)

			// change the +/- symbol
			if (difference < 0.005 && difference > -0.005) {
				diffsymbol = "±"
			} else if (difference >= 0.005) {
				diffsymbol = "+"
			} else {
				diffsymbol = ""
			}

			// adjust visible decimal places based on difference value
			if (difference < 10 && difference > -10) {
				differencerounded = Math.round(difference * 100) / 100
			} else if (difference < 100 && difference > -100) {
				differencerounded = Math.round(difference * 10) / 10
			} else {
				differencerounded = Math.round(difference)
			}

			const response = await axios.get(`${endpoint}pp.php?k=${apiKey}&m=${RuleSetId}&t=pp&v=${newpp}`)
			const ReponseData = response.data
			const TopPlay = scores.filter(x => x > ppraw).length + 1

			const embed = new EmbedBuilder()
				.setColor("Purple")
				.setAuthor({
					name: `${user.username} ${pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
					iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
					url: `https://osu.ppy.sh/users/${user.id}`,
				})
				.setTitle(`What if ${user.username} got a ${ppraw.toFixed()}pp score?`)
				.setThumbnail(user.avatar_url)
				.setDescription(`A **${ppraw.toFixed(2)}pp** play would be ${user.username}'s **#${TopPlay}** top play. It would increase their total pp to **${newpp.toFixed(2).toLocaleString()}** (+${Math.round(newpp - user.statistics.pp).toLocaleString()}pp) and increase their rank to **#${ReponseData.rank.toLocaleString()}** (+${(user.statistics.global_rank - ReponseData.rank).toLocaleString()}).`)

			message.channel.send({ embeds: [embed] })
		}
	})
}
exports.name = ["whatiftaiko"]
exports.aliases = ["whatifraiko", "wift"]
exports.description = ["Learn how much pp you're missing from reaching a certain rank\n\n**Parameters:**\n`username` get the recent play of a user (must be first parameter)\n`(number)`"]
exports.usage = [`wift YoruNoKen 352`]
exports.category = ["osu"]
