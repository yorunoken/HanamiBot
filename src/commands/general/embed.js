exports.run = async (client, message, args, prefix) => {
	const channel = client.channels.cache.get(message.channel.id)
	channel.messages.fetch({ limit: 100 }).then(async messages => {
		await message.channel.sendTyping()

		//find the latest message with an embed
		let embedMessage
		for (const [id, m] of messages) {
			if (m.embeds.length > 0 && m.author.bot) {
				embedMessage = m
				break
			}
		}

		try {
			if (embedMessage) {
				//get the embed data
				const embed = embedMessage.embeds[0]
				console.log(embed)

				//author embed
				if (embed.author) {
					const embed_author = embed.author.url
					try {
						const beatmapId = embed_author.match(/\d+/)[0]
						try {
							//code here
							return
						} catch (err) {
							console.log(err)
						}
					} catch (err) {}
				}

				//url embed
				if (embed.url) {
					const embed_author = embed.url
					try {
						const beatmapId = embed_author.match(/\d+/)[0]
						try {
							//code here
							return
						} catch (err) {
							console.log(err)
						}
					} catch (err) {}
				}

				if (embed.description) {
					try {
						const str = embed.description
						const regex = /\/b\/(\d+)/
						const match = regex.exec(str)
						const beatmapId = match?.[1]
						try {
							//code here
							return
						} catch (err) {
							console.log(err)
						}
					} catch (err) {}
				}
			}
		} catch (err) {
			message.channel.send("No embeds found in the last 100 messages")
		}
	})
}
exports.name = "embed"
exports.aliases = ["embed"]
exports.description = ["this is a description for embed"]
exports.usage = [`embed`]
exports.category = ["general"]
