const fs = require("fs")
const { PermissionsBitField } = require("discord.js")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	//check if args is empty
	if (!args.length) {
		// Load the prefixes for each guild
		let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"))

		if (!prefixes[message.guild.id]) {
			// If not, set the prefix to the default prefix
			prefix = "?"
		} else {
			// If the guild has a prefix stored, use that prefix
			prefix = prefixes[message.guild.id]
		}
		message.reply(`my prefix is **${prefix}**`)
	} else {
		//check if the user has permissions to change the prefix
		if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return message.reply("You do not have permission to use this command.")
		const newPrefix = args[0]

		//check if the args are valid
		if (!args.length) {
			message.reply("Please enter a prefix.")
		} else {
			//set prefix
			fs.readFile("./prefixes.json", "utf8", (err, data) => {
				if (err) throw err
				const prefixes = JSON.parse(data)
				prefixes[message.guild.id] = newPrefix
				fs.writeFile("./prefixes.json", JSON.stringify(prefixes, null, 2), err => {
					if (err) throw err
					message.channel.send(`Prefix updated to **${newPrefix}**`)
				})
			})
		}
	}
}
exports.name = "prefix"
exports.aliases = ["prefix"]
exports.description = ["Displays the prefix for the server if no arguments are provided. \nUsers with admin permissions can change the prefix by providing an argument"]
exports.usage = [`prefix #`]
exports.category = ["general"]
