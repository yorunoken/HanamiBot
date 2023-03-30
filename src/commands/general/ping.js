exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();

	message.channel.send(`Pong! 🏓`).then(async (msg) => {
		let time = msg.createdTimestamp - message.createdTimestamp;

		const startTime = Date.now();

		const url = "https://osu.ppy.sh/api/v2/users/yorunoken/osu";
		const headers = {
			Authorization: `Bearer ${process.env.osu_bearer_key}`,
		};
		const response = await fetch(url, {
			method: "GET",
			headers,
		});
		await response.json();

		let osuTime = Date.now() - startTime;

		msg.edit(`Pong! 🏓\n(Discord Latency: ${time}ms)\n(osu!api Latency: ${osuTime}ms)`);
	});
};
exports.name = "ping";
exports.aliases = ["ping"];
exports.description = ["Displays the bot's and osu! api's latency, also checks to see if the bot is active"];
exports.usage = [`ping`];
exports.category = ["general"];
