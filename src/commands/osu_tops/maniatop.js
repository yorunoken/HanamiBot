const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

// importing top
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
		let ModeOsu = "mania";
		let RulesetId = 3;
		let RB = false;

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

		if (args.includes("-i")) {
			const iIndex = args.indexOf("-i");
			play_number = args[iIndex + 1];
		} else if (args.includes("-p")) {
			PageNumber = args[args.indexOf("-p") + 1];
		} else {
			PageNumber = 1;
		}

		if (PageNumber > 20) {
			message.reply(`**Value must not be greater than 20**`);
			return;
		}
		if (play_number > 100) {
			message.reply(`**Value must not be greater than 100**`);
			return;
		}

		if (args.join(" ").startsWith("-r") || args.join(" ").startsWith("-recent") || args.join(" ").startsWith("-i") || args.join(" ").startsWith("mods") || args.join(" ").startsWith("+") || args.join(" ").startsWith("-g") || args.join(" ").startsWith("-am") || args.join(" ").startsWith("-amount") || args.join(" ").startsWith("-rev") || args.join(" ").startsWith("-reverse")) {
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
			const url = new URL(`https://osu.ppy.sh/api/v2/users/${userargs}/${ModeOsu}`);
			const headers = {
				Authorization: `Bearer ${process.env.osu_bearer_key}`,
			};
			const response = await fetch(url, {
				method: "GET",
				headers,
			});
			user = await response.json();

			if (user.id === undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in Bancho database**`)] });
				return;
			}
		}

		if (server == "gatari") {
			var Userurl = `https://api.gatari.pw/users/get?u=`;
			var UserStatsurl = `https://api.gatari.pw/user/stats?u=`;

			const userResponse = await fetch(`${Userurl}${userargs}`, { method: "GET" });
			const userStatsResponse = await fetch(`${UserStatsurl}${userargs}&${RulesetId}`, { method: "GET" });

			user = userResponse.data.users[0];
			userstats = userStatsResponse.data.stats;

			if (user == undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in Gatari database**`)] });
				return;
			}
		}

		if (args.includes("-am") || args.includes("-g")) {
			if (args.join(" ").includes("-am")) query = "-am";
			if (args.join(" ").includes("-amount")) query = "-amount";
			if (args.join(" ").includes("-g")) query = "-g";

			const iIndex = args.indexOf(query);
			const GIndex = Number(args[iIndex + 1]);

			let score;

			if (server == "gatari") {
				var url = `https://api.gatari.pw/user/scores/best`;
				const response = await fetch(`${url}?id=${user.id}&l=100&p=1&mode=${RuleSetId}&mods=${modSort}`, { method: "GET" });
				score = response.data.scores;
			}

			if (server == "bancho") {
				const url = new URL(`https://osu.ppy.sh/api/v2/users/${user.id}/scores/best`);
				const params = {
					mode: ModeOsu,
					limit: "100",
					offset: "0",
				};
				Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
				const headers = {
					Authorization: `Bearer ${process.env.osu_bearer_key}`,
				};
				const response = await fetch(url, {
					method: "GET",
					headers,
				});

				score = await response.json();
			}

			const Number_bigger = score.filter(x => x.pp > GIndex);

			const embed = new EmbedBuilder()
				.setColor("Purple")
				.setDescription(`${user.username} has **\`${Number_bigger.length}\`** plays worth more than ${GIndex.toFixed(1)}PP`)
				.setFooter({ text: `osu!${server}` });

			message.channel.send({ embeds: [embed] });
			return;
		}

		if (args.includes("-r") || args.includes("-recent")) RB = true;

		message.channel.send({ embeds: [await GetUserTop(user, userstats, PageNumber, ModeOsu, RulesetId, args, argValues["mods"], play_number, RB, server)] });
	});
};
exports.name = ["maniatop"];
exports.aliases = ["maniatop", "mtop", "topm", "topmania"];
exports.description = ["Displays user's Mania top plays\n\n**Parameters:**\n`username` get the top plays of a user (must be first parameter) \n`-i (number)` get a specific play (1-100)\n`-p (number)` get a specific page (1-20)\n`-g (number)` find out how much of a pp play you have in your top plays"];
exports.usage = [`mtop MadVillain -i 7\nmaniatop jakads -p 6`];
exports.category = ["osu"];
