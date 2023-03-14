exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	const url = args.join("")
	message.reply(`https://convert2mp3s.com/api/single/mp3?url=${url}`)
}
exports.name = "mp3"
exports.aliases = ["mp3"]
exports.description = ["give you a link of a download to the mp3 of a video\n\n**Parameters:**\n`link` link to the video"]
exports.usage = [`mp3 {link}`]
exports.category = ["general"]
