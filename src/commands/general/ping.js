const { performance: count_performance } = require("perf_hooks")
const { v2, auth } = require("osu-api-extended")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	message.channel.send(`Pong! 🏓`).then(async msg => {
		let time = msg.createdTimestamp - message.createdTimestamp
		const startTime = performance.now()
		await auth.login(process.env.client_id, process.env.client_secret)
		await v2.user.details("yorunoken", "osu")
		let osutime = (performance.now() - startTime).toFixed(0)
		msg.edit(`Pong! 🏓\n(Latency: ${time}ms)\n(osu!api Latency: ${osutime}ms)`)
	})
}
exports.name = "ping"
exports.aliases = ["ping"]
exports.description = ["Displays the bot's and osu! api's latency, also checks to see if the bot is active"]
exports.usage = [`ping`]
exports.category = ["general"]
