const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

const { GetUserTop } = require("../../utils/exports/top_export.js");
const { FindUserargs } = require("../../utils/exports/finduserargs_export.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error);
			return;
		}
		const userData = JSON.parse(data);
		let PageNumber = 1;
		let play_number = undefined;
		let ModeOsu = "osu";
		let RuleSetId = 0;
		let RB = false;
		let FailPlay = 1;

		let argValues = {};
		for (const arg of args) {
			const [key, value] = arg.split("=");
			argValues[key] = value;
		}

		try {
			server = userData[message.author.id].server || "bancho";
		} catch (err) {
			server = "bancho";
		}

		if (args.includes("-bancho")) server = "bancho";
		if (args.includes("-gatari")) server = "gatari";

		var userargs = await FindUserargs(message, args, server, prefix);

		if (args.includes("-mania")) {
			RuleSetId = 3;
			ModeOsu = "mania";
		}

		if (args.includes("-taiko")) {
			RuleSetId = 1;
			ModeOsu = "taiko";
		}

		if (args.includes("-ctb")) {
			RuleSetId = 2;
			ModeOsu = "ctb";
		}

		if (args.includes("-i")) {
			const iIndex = args.indexOf("-i");
			play_number = args[iIndex + 1];
		} else if (args.includes("-p")) {
			PageNumber = args[args.indexOf("-p") + 1];
		} else {
			PageNumber = 1;
		}

		if (args.includes("-pass")) FailPlay = 0;
		if (args.includes("-ps")) FailPlay = 0;

		if (PageNumber > 20) {
			message.reply(`**Value must not be greater than 20**`);
			return;
		}
		if (play_number > 100) {
			message.reply(`**Value must not be greater than 100**`);
			return;
		}

		if (args.join(" ").startsWith("-page") || args.join(" ").startsWith("-p") || args.join(" ").startsWith("-pass") || args.join(" ").startsWith("-ps") || args.join(" ").startsWith("-i") || args.join(" ").startsWith("mods") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-taiko") || args.join(" ").startsWith("-rev") || args.join(" ").startsWith("-reverse")) {
			try {
				if (server == "bancho") userargs = userData[message.author.id].BanchoUserId;
				if (server == "gatari") userargs = userData[message.author.id].GatariUserId;
			} catch (err) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Set your osu! username by typing "${prefix}link **your username**"`)] });
			}
		}

		let user;
		let userstats;
		if (server == "bancho") {
			headers = {
				Authorization: `Bearer ${process.env.osu_bearer_key}`,
			};

			url = new URL(`https://osu.ppy.sh/api/v2/users/${userargs}/${ModeOsu}`);
			response = await fetch(url, {
				method: "GET",
				headers,
			});
			user = await response.json();

			if (user.id === undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in Bancho database**`)] });
				return;
			}

			url = new URL(`https://osu.ppy.sh/api/v2/users/${user.id}/scores/recent`);
			params = {
				include_fails: FailPlay,
				mode: ModeOsu,
				limit: "100",
				offset: "0",
			};
			Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
			response = await fetch(url, {
				method: "GET",
				headers,
			});
			score = await response.json();

			console.log(score);

			if (score.length == 0) {
				message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No Bancho plays found for **${user.username}**`)] });
				return;
			}
		}

		if (server == "gatari") {
			Userurl = `https://api.gatari.pw/users/get?u=`;
			UserStatsurl = `https://api.gatari.pw/user/stats?u=`;

			response = await fetch(`${Userurl}${userargs}`, { method: "GET" });
			userResponse = await response.json();

			response = await fetch(`${UserStatsurl}${userargs}&${RuleSetId}`, { method: "GET" });
			userStatsResponse = await response.json();

			user = userResponse.users[0];
			userstats = userStatsResponse.stats;

			url = `https://api.gatari.pw/user/scores/recent`;
			const response = await fetch(`${url}?id=${user.id}&l=100&p=1&mode=${RuleSetId}&mods=${modSort}`, { method: "GET" }).then(response => response.json());
			score = response.scores;
			if (score == null) {
				message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No Gatari plays found for **${user.username}**`)] });
				return;
			}

			if (user == undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in Gatari database**`)] });
				return;
			}
		}

		message.channel.send({ embeds: [await GetUserTop(score, user, userstats, PageNumber, ModeOsu, RuleSetId, args, argValues["mods"], play_number, RB, server)] });
	});
};
exports.name = ["recentlist"];
exports.aliases = ["recentlist", "rl", "rls"];
exports.description = ["Displays user's list of recent osu!standard plays\n\n**Parameters:**\n`username` get the recent play of a user (must be first parameter) \n`-i (number)` get a specific play (1-100)\n`-pass` get the latest passed play (no parameters)\n`mods=(string)` get the latest play by mods"];
exports.usage = [`recentlist YoruNoKen\nrls Whitecat -i 4\nrls -pass -i 3`];
exports.category = ["osu"];
