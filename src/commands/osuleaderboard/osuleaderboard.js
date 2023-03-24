const { EmbedBuilder } = require("discord.js");

// importing top
const { GetLeaderboardCount } = require("../../utils/exports/osustats_leaderboard");
const { FindUserargs } = require("../../utils/exports/finduserargs_export.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	let modeOsu = "osu";
	let server = "bancho";

	var userargs = await FindUserargs(message, args, server, prefix);

	const headers = {
		Authorization: `Bearer ${process.env.osu_bearer_key}`,
	};
	let url = new URL(`https://osu.ppy.sh/api/v2/users/${userargs}/${modeOsu}`);
	const response = await fetch(url, {
		method: "GET",
		headers,
	});
	const user = await response.json();

	if (user.id === undefined) {
		message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in Bancho database**`)] });
		return;
	}

	message.channel.send({ embeds: [await GetLeaderboardCount(user)] });
};
exports.name = ["osuleaderboard"];
exports.aliases = ["osuleaderboard", "ol", "osul"];
exports.description = ["Displays how many leaderboard spots user is in\n\n**Parameters:**\n`username` get the top plays of a user (must be first parameter)"];
exports.usage = [`ol\nosul chocomint`];
exports.category = ["osu"];
