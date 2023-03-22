exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();

	const reddit = await fetch("https://i.reddit.com/api/v1/authorize", { method: "GET" }).then(response => response.json());
};
exports.name = "reddit";
exports.aliases = ["reddit"];
exports.description = ["Returns a random photo from a subreddit"];
exports.usage = [`reddit komi-san`];
exports.category = ["fun"];
