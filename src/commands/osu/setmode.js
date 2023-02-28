const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	const mode = args[0]

	if (mode != "osu" && mode != "ctb" && mode != "mania" && mode != "taiko") {
		message.reply("**Please set your game mode to a valid mode.**\n`osu (standard)`, `fruits (ctb)`, `mania`, `taiko`")
		return
	}

	// Read the JSON file
	fs.readFile("./user-data.json", (error, data) => {
		if (error) {
			console.log(error)
			return
		}

		// update the user's osu! mode in the JSON file
		const userData = JSON.parse(data)

		userData[message.author.id] = { ...userData[message.author.id], osumode: mode }

		fs.writeFile("./user-data.json", JSON.stringify(userData), error => {
			if (error) {
				console.log(error)
			} else {
				message.reply(`Set osu! gamemode to **${mode}**`)
			}
		})
	})
}
exports.name = "setmode"
exports.aliases = ["setmode"]
exports.description = ["Sets an osu! game mode as your default.\n**Parameters:**\n`mode` set your default mode to the argument"]
exports.usage = [`setmode osu`]
exports.category = ["osu"]
