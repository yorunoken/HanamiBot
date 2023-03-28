const { EmbedBuilder } = require("discord.js")
const { v2, auth } = require("osu-api-extended")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	let ErrCount = 0
	let EmbedValue = 0
	let GoodToGo = false

	await auth.login(process.env.client_id, process.env.client_secret)

	//find the latest message with an embed
	async function SendEmbed(map, beatmapId) {
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${map.beatmapset.artist} - ${map.beatmapset.title}`,
				url: `https://osu.ppy.sh/b/${beatmapId}`,
			})
			.setImage(`https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/raw.jpg`)
		message.channel.send({ embeds: [embed] })
	}

	async function EmbedFetch(embed) {
		try {
			const embed_author = embed.url
			if (embed_author.includes("/users/")) throw new Error("Wrong embed")
			if (embed_author.includes("/u/")) throw new Error("Wrong embed")
			const beatmapId = embed_author.match(/\d+/)[0]

			const map = await v2.beatmap.diff(beatmapId)

			if (map.id == undefined) throw new Error("No URL")
			//send the embed
			await SendEmbed(map, beatmapId)
			GoodToGo = true
		} catch (err) {
			try {
				const embed_author = embed.author.url
				const beatmapId = embed_author.match(/\d+/)[0]

				const map = await v2.beatmap.diff(beatmapId)
				if (map.id == undefined) throw new Error("No Author")

				//send the embed
				await SendEmbed(map, beatmapId)
				GoodToGo = true
			} catch (err) {
				try {
					const regex = /\/b\/(\d+)/
					const match = regex.exec(embed.description)
					const beatmapId = match[1]

					const map = await v2.beatmap.diff(beatmapId)
					if (map.id == undefined) throw new Error("No Desc")
					//send the embed
					await SendEmbed(map, beatmapId)
					GoodToGo = true
					return
				} catch (err) {
					EmbedValue++
					ErrCount++
				}
			}
		}

		if (ErrCount == 1) {
			await message.reply(`**No maps found.**`)
		}
	}

	if (message.mentions.users.size > 0 && message.mentions.repliedUser.bot) {
		message.channel.messages.fetch(message.reference.messageId).then(message => {
			const embed = message.embeds[0]

			EmbedFetch(embed)
		})
		return
	}

	const channel = client.channels.cache.get(message.channel.id)
	channel.messages.fetch({ limit: 100 }).then(async messages => {
		//find the latest message with an embed
		let embedMessages = []
		for (const [id, message] of messages) {
			if (message.embeds.length > 0 && message.author.bot) {
				embedMessages.push(message)
			}
		}

		try {
			if (args) {
				//if args doesn't start with https: try to get the beatmap id by number provided
				if (!args[0].startsWith("https:")) {
					beatmapId = args[0]
				} else {
					//try to get beatmapId by link
					const regex = /\/(\d+)$/
					const match = regex.exec(args[0])
					beatmapId = match[1]
				}

				const map = await v2.beatmap.diff(beatmapId)
				if (map.id == undefined) throw new Error("No html")

				//send the embed
				await SendEmbed(map, beatmapId)
				return
			}
		} catch (err) {
			try {
				if (embedMessages) {
					do {
						if (!embedMessages[EmbedValue].embeds[0]) break
						const embed = embedMessages[EmbedValue].embeds[0]
						await EmbedFetch(embed)
					} while (!GoodToGo)
				} else {
					await message.channel.send("No embeds found in the last 100 messages")
				}
			} catch (err) {
				message.channel.send("**No maps found**")
			}
		}
	})
}
exports.name = "background"
exports.aliases = ["background", "bg"]
exports.description = ["Displays the background of a beatmap.\n\n**Parameters:**\n`beatmap link` include a beatmap link at the end to get its background"]
exports.usage = [`background`]
exports.category = ["osu"]
