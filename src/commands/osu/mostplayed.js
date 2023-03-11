const fs = require("fs")
const { EmbedBuilder } = require("discord.js")
const { v2, auth } = require("osu-api-extended")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		if (message.mentions.users.size > 0) {
			const mentionedUser = message.mentions.users.first()
			try {
				if (message.content.includes(`<@${mentionedUser.id}>`)) {
					userargs = userData[mentionedUser.id].BanchoUserId
				}
			} catch (err) {
				console.error(err)
				if (mentionedUser) {
					if (message.content.includes(`<@${mentionedUser.id}>`)) {
						try {
							userData[mentionedUser.id].BanchoUserId
						} catch (err) {
							message.reply(`No osu! user found for ${mentionedUser.tag}`)
						}
					} else {
						try {
							userData[message.author.id].BanchoUserId
						} catch (err) {
							message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
						}
					}
				}
				return
			}
		}

		if (args[0] === undefined) {
			try {
				userargs = userData[message.author.id].BanchoUserId
			} catch (err) {
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

		if (args.join(" ").startsWith("-p") || args.join(" ").startsWith("-page") || args.join(" ").startsWith("page=") || args.join(" ").startsWith("p=")) {
			try {
				userargs = userData[message.author.id].BanchoUserId
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
			}
		}

		//log into api
		await auth.login_lazer(process.env.userd, process.env.pass)
		const user = await v2.user.details(userargs, "osu")

		if (user.id == undefined) {
			message.reply(`The user \`${userargs}\` doesn't exist.`)
			return
		}

		const returnNumber = 100
		const mp = await v2.user.beatmaps.most_played(user.id, {
			limit: returnNumber,
		})

		let argValues = {}
		for (const arg of args) {
			const [key, value] = arg.split("=")
			argValues[key] = value
		}

		const pageLimit = 10
		const pageCount = Math.ceil(mp.length / pageLimit)

		let PageNum
		PageNum = Number(argValues["page"])
		if (isNaN(PageNum)) PageNum = Number(argValues["p"])
		if (isNaN(PageNum)) {
			if (args.join(" ").includes("-p")) {
				const iIndex = args.indexOf("-p")
				PageNum = Number(args[iIndex + 1])
			}
			if (args.join(" ").includes("-page")) {
				const iIndex = args.indexOf("-page")
				PageNum = Number(args[iIndex + 1])
			}
		}
		if (isNaN(PageNum)) PageNum = 1

		// Function to generate an embed for a given page number
		function generateEmbed(page) {
			const start = (page - 1) * pageLimit

			const end = page * pageLimit

			const pageBeatmaps = mp.slice(start, end)

			try {
				if (user.id == undefined) throw new Error("The user doesn't exist")
			} catch (err) {
				message.reply(`**The user \`${userargs}\` doesn't exist**`)
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

			const embed = new EmbedBuilder()
				.setAuthor({
					name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
					iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
					url: `https://osu.ppy.sh/users/${user.id}`,
				})
				.setDescription(pageBeatmaps.map((beatmap, index) => `#${start + index + 1} ▹ __[${beatmap.count}]__ ▹ [${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.beatmap.version}]](https://osu.ppy.sh/b/${beatmap.beatmap_id}) [${beatmap.beatmap.difficulty_rating}★]`).join("\n"))
				.setThumbnail(`https://a.ppy.sh/${user.id}?1668890819.jpeg`)
				.setFooter({ text: `Page ${page}/${pageCount}` })

			return embed
		}

		console.log("file: mostplayed.js:133 ~ fs.readFile ~ PageNum:", PageNum)
		message.channel.send({ content: `${mp.length} Most played Beatmaps`, embeds: [generateEmbed(PageNum)] })
	})
}
exports.name = "mostplayed"
exports.aliases = ["mostplayed", "mp"]
exports.description = ["Displays a user's most played beatmaps.**Parameters:**\n`-p {number}` browse through the pages"]
exports.usage = [`mp chocomint`]
exports.category = ["osu"]
