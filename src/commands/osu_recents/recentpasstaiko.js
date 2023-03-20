const fs = require("fs");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

// importing GetRecent
const { GetRecent } = require("../../utils/exports/recent_export");
const { FindUserargs } = require("../../utils/exports/finduserargs_export.js");
const { GetReplay } = require("../../utils/exports/replay_export.js");

module.exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error);
			return;
		}
		const userData = JSON.parse(data);
		let value = 0;
		let mode = "taiko";
		let RuleSetId = 1;
		let PassDetermine = 0;
		try {
			server = userData[message.author.id].server || "bancho";
		} catch (err) {
			server = "bancho";
		}

		if (args.includes("-bancho")) server = "bancho";
		if (args.includes("-gatari")) server = "gatari";
		if (args.includes("-akatsuki")) server = "akatsuki";

		if (args.includes("-i")) {
			const iIndex = args.indexOf("-i");
			value = args[iIndex + 1] - 1;
		}

		var userargs = await FindUserargs(message, args, server, prefix);

		if (args.join(" ").startsWith("-gatari") || args.join(" ").startsWith("-akatsuki") || args.join(" ").startsWith("-bancho") || args.join(" ").startsWith("-i") || args.join(" ").startsWith("mods") || args.join(" ").startsWith("+")) {
			try {
				if (server == "bancho") userargs = userData[message.author.id].BanchoUserId;
				if (server == "gatari") userargs = userData[message.author.id].GatariUserId;
				if (server == "akatsuki") userargs = userData[message.author.id].AkatsukiUserId;
			} catch (err) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Set your osu! username by typing "${prefix}link **your username**"`)] });
			}
		}

		let user;
		let userstats;

		if (server == "bancho") {
			const url = new URL(`https://osu.ppy.sh/api/v2/users/${userargs}/${mode}`);
			const headers = {
				Authorization: `Bearer ${process.env.osu_bearer_key}`,
			};
			const response = await fetch(url, {
				method: "GET",
				headers,
			});
			user = await response.json();

			if (user.id === undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] });
				return;
			}
		}

		if (server == "gatari") {
			var Userurl = `https://api.gatari.pw/users/get?u=`;
			var UserStatsurl = `https://api.gatari.pw/user/stats?u=`;

			const userResponse = await fetch(`${Userurl}${userargs}`, { method: "GET" });
			const userStatsResponse = await fetch(`${UserStatsurl}${userargs}&${RuleSetId}`, { method: "GET" });

			user = userResponse.data.users[0];
			userstats = userStatsResponse.data.stats;

			if (user == undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] });
				return;
			}
		}

		if (server == "akatsuki") {
			var BaseUrl = `https://akatsuki.pw/api/v1`;

			if (isNaN(userargs)) {
				try {
					var response = await fetch(`${BaseUrl}/users/whatid?name=${userargs}`, { method: "GET" });
					userargs = response.data.id;
				} catch (err) {
					message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] });
					return;
				}
			}

			var response = await fetch(`${BaseUrl}/users/full?id=${userargs}`, { method: "GET" });
			user = response.data;

			if (user.code != 200) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] });
				return;
			}
		}

		const Recent = await GetRecent(value, user, mode, PassDetermine, args, RuleSetId, userstats, server);

		let row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("render").setDisabled().setStyle(ButtonStyle.Primary).setLabel("Render"));
		if (Recent.top1k) {
			row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("render").setStyle(ButtonStyle.Primary).setLabel("Render"));
			message.channel.send({ content: Recent.FilterMods, embeds: [Recent.embed.data], components: [row] });

			const filter = m => m.user.id === message.author.id;
			const collector = message.channel.createMessageComponentCollector({ filter: filter, max: 1, time: 50000 });

			collector.on("collect", async collected => {
				let collectedm = collected.message;
				let user = collected.user;
				let score_id = Recent.score_id;

				collected.update({ content: Recent.FilterMods, embeds: [Recent.embed.data], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("render").setDisabled().setStyle(ButtonStyle.Primary).setLabel("Render"))] });
				GetReplay(message, collectedm, user, score_id, mode);
				return;
			});

			collector.on("end", async m => {});
			return;
		}
		message.channel.send({ content: Recent.FilterMods, embeds: [Recent.embed.data] });
	});
};
exports.name = ["recentpasstaiko"];
exports.aliases = ["recentpasstaiko", "rpt", "rspt", "rptaiko"];
exports.description = ["Displays user's recent passed osu!taiko play\n\n**Parameters:**\n`username` get the recent play of a user (must be first parameter) \n`-i (number)` get a specific play (1-100)\n`-pass` get the latest passed play (no parameters)\n`mods=(string)` get the latest play by mods"];
exports.usage = [`rt JustinNF -i 8\nrecenttaiko Peaceful -pass`];
exports.category = ["osu"];
