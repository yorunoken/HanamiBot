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
		let mode = "osu";
		let RuleSetID = 0;
		let PassDetermine = 1;
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

		if (args.includes("-mania")) {
			mode = "mania";
			RuleSetID = 3;
		}
		if (args.includes("-taiko")) {
			mode = "taiko";
			RuleSetID = 1;
		}
		if (args.includes("-ctb")) {
			mode = "fruits";
			RuleSetID = 2;
		}
		if (args.includes("-pass") || args.includes("-ps")) {
			PassDetermine = 0;
		}

		var userargs = await FindUserargs(message, args, server, prefix);

		if (
			args.join(" ").startsWith("-gatari") ||
			args.join(" ").startsWith("-akatsuki") ||
			args.join(" ").startsWith("-bancho") ||
			args.join(" ").startsWith("-mania") ||
			args.join(" ").startsWith("-ctb") ||
			args.join(" ").startsWith("-taiko") ||
			args.join(" ").startsWith("-osu") ||
			args.join(" ").startsWith("-i") ||
			args.join(" ").startsWith("-pass") ||
			args.join(" ").startsWith("-ps") ||
			args.join(" ").startsWith("mods") ||
			args.join(" ").startsWith("+")
		) {
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

			if (user.username == "YoruNoKen") {
				const embed = new EmbedBuilder()
					.setColor("Purple")
					.setAuthor({
						name: `YoruNoKen 7450.54pp (#13,554 TR#93) `,
						iconURL: `https://osu.ppy.sh/images/flags/TR.png`,
						url: "https://osu.ppy.sh/users/17279598/osu",
					})
					.setTitle("VINXIS - Sidetracked Day [Sojourn Collab]")
					.setURL(`https://osu.ppy.sh/b/2111505`)
					.setDescription(
						`<:S_:1057763291998474283> **+NM** • **__[7.62★]__** 🌐 #181\n▹**641.24**/683.77PP \n▹108,461,790 • **(99.34%)**\n▹[ **2185**x/2186x ] • {**1592**/16/0/0}\n▹Score Set <t:1680374580:R>• **Try #1**`,
					)
					.setFields({
						name: `**Beatmap info:**`,
						value: `BPM: \`188\` Objects: \`1608\` Length: \`5:35\` (\`5:14\`)\nAR: \`9.8\` OD: \`9.5\` CS: \`4.3\` HP: \`6.0\``,
					})
					.setImage(`https://assets.ppy.sh/beatmaps/1008679/covers/cover.jpg`)
					.setThumbnail("https://a.ppy.sh/17279598?1679428025.jpeg")
					.setFooter({ text: `Ranked map by Chanci | osu!bancho`, iconURL: "https://a.ppy.sh/5522589" });
				message.channel.send({ embeds: [embed] });
				return;
			}

			if (user.id === undefined) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] });
				return;
			}
		}

		if (server == "gatari") {
			var Userurl = `https://api.gatari.pw/users/get?u=`;
			var UserStatsurl = `https://api.gatari.pw/user/stats?u=`;

			var response = await fetch(`${Userurl}${userargs}`, { method: "GET" });
			var userResponse = await response.json();
			var response = await fetch(`${UserStatsurl}${userargs}&${RuleSetID}`, { method: "GET" });
			var userStatsResponse = await response.json();

			user = userResponse.users[0];
			userstats = userStatsResponse.stats;

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
					var args_data = await response.json();
					userargs = args_data.id;
				} catch (err) {
					message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] });
					return;
				}
			}

			var response = await fetch(`${BaseUrl}/users/full?id=${userargs}`, { method: "GET" });
			user = await response.json();

			if (user.code != 200) {
				message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist in osu!${server}**`)] });
				return;
			}
		}

		const Recent = await GetRecent(value, user, mode, PassDetermine, args, RuleSetID, userstats, server);

		if (Recent.embed == undefined) {
			message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setTitle("Huh...").setDescription("Something went wrong. Please check if you have any spelling errors!")] });
			return;
		}

		let row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("render").setDisabled().setStyle(ButtonStyle.Primary).setLabel("Render"));
		if (Recent.top1k) {
			row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("render").setStyle(ButtonStyle.Primary).setLabel("Render"));
			message.channel.send({ content: Recent.FilterMods, embeds: [Recent.embed.data], components: [row] });

			const filter = (m) => m.user.id === message.author.id;
			const collector = message.channel.createMessageComponentCollector({ filter: filter, max: 1, time: 50000 });

			collector.on("collect", async (collected) => {
				let collectedm = collected.message;
				let user = collected.user;
				let score_id = Recent.score_id;

				collected.update({
					content: Recent.FilterMods,
					embeds: [Recent.embed.data],
					components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("render").setDisabled().setStyle(ButtonStyle.Primary).setLabel("Render"))],
				});
				GetReplay(message, collectedm, user, score_id, mode);
				return;
			});

			collector.on("end", async (m) => {});
			return;
		}
		message.channel.send({ content: Recent.FilterMods, embeds: [Recent.embed.data] });
	});
};
exports.name = ["recent"];
exports.aliases = ["recent", "r", "rs"];
exports.description = [
	"Displays user's recent osu!standard play\n\n**Parameters:**\n`username` get the recent play of a user (must be first parameter) \n`-i (number)` get a specific play (1-100)\n`-pass` get the latest passed play (no parameters)\n`mods=(string)` get the latest play by mods",
];
exports.usage = [`recent YoruNoKen\nrs Whitecat -i 4\nrs -pass -i 3\nrecent mods=dt -pass`];
exports.category = ["osu"];
