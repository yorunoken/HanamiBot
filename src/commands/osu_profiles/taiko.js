const fs = require("fs");
const { v2, auth } = require("osu-api-extended");
const axios = require("axios");

// imports
const { GetUserPage } = require("../../utils/exports/osu_export.js");
const { FindUserargs } = require("../../utils/exports/finduserargs_export.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error);
			return message.reply("An error occurred while reading user data.");
		}
		const userData = JSON.parse(data);
		let mode = "taiko";
		let RuleSetId = 1;
		let server = "taiko";
		try {
			server = userData[message.author.id].server;
		} catch (err) {}

		if (args.includes("-bancho")) server = "bancho";
		if (args.includes("-gatari")) server = "gatari";

		var userargs = await FindUserargs(message, args, server, prefix);
		if (args[0] == "-bancho" || args[0] == "-gatari" || args.join(" ").startsWith("-d") || args.join(" ").startsWith("-details")) {
			try {
				if (server == "bancho") userargs = userData[message.author.id].BanchoUserId;
				if (server == "gatari") userargs = userData[message.author.id].GatariUserId;
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`);
				return;
			}
		}

		let user, userstats;
		let firstPage = true;

		if (server == "bancho") {
			//log into api
			await auth.login(process.env.client_id, process.env.client_secret);
			user = await v2.user.details(userargs, mode);
			userstats = "";
			if (user.id == undefined) {
				message.channel.send(`**User doesn't exist in bancho database**`);
				return;
			}
		}

		if (server == "gatari") {
			var Userurl = `https://api.gatari.pw/users/get?u=`;
			var UserStatsurl = `https://api.gatari.pw/user/stats?u=`;

			var response = await fetch(`${Userurl}${userargs}`, { method: "GET" });
			var userResponse = await response.json();
			var response = await fetch(`${UserStatsurl}${userargs}&${RuleSetId}`, { method: "GET" });
			var userStatsResponse = await response.json();

			user = userResponse.users[0];
			userstats = userStatsResponse.stats;

			if (user == undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] });
				return;
			}
		}

		if (args.join(" ").includes("-d") || args.join(" ").includes("-details")) firstPage = false;

		message.channel.send({ embeds: [await GetUserPage(firstPage, user, userstats, mode, RuleSetId, server)] });
	});
};
exports.name = "taiko";
exports.aliases = ["taiko"];
exports.description = ["Displays the stats of a user\n\n**Parameters:**\n`username` get the stats from a username"];
exports.usage = [`osu NeuralG`];
exports.category = ["osu"];
