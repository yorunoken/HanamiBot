const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
		} else {
			const userData = JSON.parse(data)
			if (message.mentions.users.size > 0) {
				const mentionedUser = message.mentions.users.first()
				try {
					if (mentionedUser) {
						if (message.content.includes(`<@${mentionedUser.id}>`)) {
							userargs = userData[mentionedUser.id].BanchoUserId
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
				}
			}
			await auth.login(process.env.client_id, process.env.client_secret)
			try {
				const me = await v2.user.details(userargs, "osu")
				try {
					me.page.raw
					fs.writeFile(`./mes/${me.id}.txt`, me.page.raw, err => {
						if (err) {
							console.log(err)
						} else {
							console.log("File saved successfully")
						}
					})
					message.channel.send({ content: `me! of \`${me.username}\``, files: [`./mes/${me.id}.txt`] })
				} catch (err) {
					message.channel.send(`User \`${me.username}\` doesn't have a **me!**`)
				}
			} catch (err) {
				//catch errors
				console.error(err)
				message.channel.send(`the user \`${userargs}\` doesn't exist`)
				return
			}
		}
	})
}
exports.name = ["me"]
exports.aliases = ["me"]
exports.description = ["Sends the me! of a user in .txt format\n\n**Parameters:**\n`username` get the me! from a username"]
exports.usage = [`me YoruNoKen`]
exports.category = ["osu"]
