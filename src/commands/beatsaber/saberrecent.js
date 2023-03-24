const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

const { GetRecent } = require("../../utils/exports/recent_export");

const { FindUserargs } = require("../../utils/exports/finduserargs_export.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error);
			return message.reply("An error occurred while reading user data.");
		}
		const userData = JSON.parse(data);

		var server = "saber";
		let mode, PassDetermine, RuleSetID;

		let value = 0;
		if (args.includes("-i")) {
			const iIndex = args.indexOf("-i");
			value = args[iIndex + 1] - 1;
		}

		var userargs = await FindUserargs(message, args, server, prefix);
		if (args.join(" ").startsWith("-i")) {
			userargs = userData[message.author.id].SteamUserId;
		}

		if (isNaN(userargs)) {
			var response = await fetch(`http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${userargs}`, { method: "GET" }).then(response => response.json());
			var data = response.response;
			if (data.success != 1) {
				message.reply(`**The user \`${userargs}\` does not exist in the Beat Saber database.**`);
				return;
			}
			userargs = data.steamid;
		}

		let user, userstats;
		var BaseUrl = `https://scoresaber.com/api`;
		user = await fetch(`${BaseUrl}/player/${userargs}/full`, { method: "GET" }).then(response => response.json());
		if (user.errorMessage == "Player not found") {
			message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player with the id \`${userargs}\` does not exist in Beat Saber database**`)] });
			return;
		}

		const Recent = await GetRecent(value, user, mode, PassDetermine, args, RuleSetID, userstats, server);

		message.channel.send({ embeds: [Recent.embed.data] });
	});
};
exports.name = "saberrecent";
exports.aliases = ["saberrecent", "sr", "bsr", "br"];
exports.description = ["Displays the stats of a user\n\n**Parameters:**\n`username` get the stats from a username"];
exports.usage = [`bsp Yoru`];
exports.category = ["saber"];
