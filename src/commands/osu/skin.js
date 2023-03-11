const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
exports.run = async (client, message, args, prefix, EmbedBuilder) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
		} else {
			let userargs
			let Skin
			const userData = JSON.parse(data)
			if (message.mentions.users.size > 0) {
				const mentionedUser = message.mentions.users.first()
				try {
					if (mentionedUser) {
						if (message.content.includes(`<@${mentionedUser.id}>`)) {
							userargs = userData[mentionedUser.id].BanchoUserId
							Skin = userData[mentionedUser.id].Url_skin
						} else {
							userargs = userData[message.author.id].BanchoUserId
							Skin = userData[message.author.id].Url_skin
						}
					}
				} catch (err) {
					console.error(err)
					message.reply(`No osu! user found for ${mentionedUser.tag}`)
					return
				}
			} else {
				if (args[0] === undefined) {
					try {
						userargs = userData[message.author.id].BanchoUserId
						Skin = userData[message.author.id].Url_skin
					} catch (err) {
						console.error(err)
						message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
						return
					}
				} else {
					//user argument
					userargs = args.join(" ")
				}
			}
			let SkinUrl
			if (args.includes("-set")) {
				SkinUrl = args[1]
				userData[message.author.id] = { ...userData[message.author.id], Url_skin: SkinUrl }
				fs.writeFile("./user-data.json", JSON.stringify(userData), error => {
					if (error) {
						console.log(error)
					} else {
						message.reply(`**Successfully assigned skin!**`)
					}
				})
				return
			}

			await auth.login(process.env.client_id, process.env.client_secret)
			const user = await v2.user.details(userargs, "osu")
			try {
				const embed = new EmbedBuilder()
					.setColor("Purple")
					.setAuthor({ name: `Skin for ${user.username}` })
					.setDescription(`\`Skin:\` ${Skin}`)
					.setThumbnail(user.avatar_url)
					.setFooter({ text: `Requested by ${message.author.tag}` })
				message.channel.send({ embeds: [embed] })
			} catch (err) {
				message.reply(`**No skin set for user**`)
				console.log(err)
			}
		}
	})
}
exports.name = "skin"
exports.aliases = ["skin"]
exports.description = ["gets skin of user. can set skin by typing `-set` argument."]
exports.usage = [`skin -set aristia v10\nskin @nawhbody`]
exports.category = ["osu"]
