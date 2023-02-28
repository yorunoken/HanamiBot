exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	let toSay = args.join(" ")
	if (!toSay) return message.reply("**please enter a phrase**")
	message.channel.send({ content: toSay })
	try {
		message.delete()
	} catch (err) {
		console.error(err)
	}
	console.log(`${message.author.tag} said: ${toSay}`)
}
exports.name = "say"
exports.aliases = ["say"]
exports.description = ["Makes the bot repeat whatever you say"]
exports.usage = [`say hello my name is gustavo`]
exports.category = ["fun"]
