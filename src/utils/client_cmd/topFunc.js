const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

// importing top
const { GetUserTop } = require("../exports/top_export.js");
const { FindUserargs } = require("../exports/finduserargs_export.js");

function getTop(message, args, prefix, RB, mode, RuleSetID) {
	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error);
			return;
		}
		const userData = JSON.parse(data);

		let argValues = {};
		for (const arg of args) {
			const [key, value] = arg.split("=");
			argValues[key] = value;
		}

		function parseArgs(args) {
			const result = {};

			result.pageNumber = 1;
			result.playNumber = undefined;
			result.server = userData[message.author.id]?.server || "bancho";

			if (args.includes("-i")) {
				result.playNumber = args[args.indexOf("-i") + 1];
			}

			if (args.includes("-p")) {
				result.pageNumber = args[args.indexOf("-p") + 1];
			}

			if (args.includes("-bancho")) {
				result.server = "bancho";
			}

			if (args.includes("-gatari")) {
				result.server = "gatari";
			}

			return result;
		}

		const unAllowed = ["-page", "-p", "-r", "-recent", "-i", "mods", "+", "-g", "-am", "-amount", "-rev", "-reverse"];

		const options = parseArgs(args);
		var playNumber = options.playNumber;
		var pageNumber = options.pageNumber;
		var server = options.server;

		var userArgs = await FindUserargs(message, args, server, prefix);
		if (unAllowed.some((word) => args.join(" ").startsWith(word))) {
			try {
				userArgs = server == "bancho" ? userData[message.author.id].BanchoUserId : userData[message.author.id].GatariUserId;
			} catch (err) {
				message.reply({
					embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Set your osu! username by typing "${prefix}link **your username**"`)],
				});
			}
		}

		let user, userstats;
		if (server == "bancho") {
			const headers = {
				Authorization: `Bearer ${process.env.osu_bearer_key}`,
			};
			const baseURL = `https://osu.ppy.sh/api/v2`;

			const userResponse = await fetch(`${baseURL}/users/${userArgs}/${mode}`, { method: "GET", headers }).then((response) => response.json());
			user = userResponse;
			if (user.username == "YoruNoKen") {
				const row1 = `1. [**Sidetracked Day [Sojourn Collab]**](https://osu.ppy.sh/b/2111505) **+NM** [7.62★]\n<:S_:1057763291998474283> ▹ **641.24PP** ▹ (99.34%) ▹ [ **2185**x/2186x ]\n108,461,790 ▹ {**1592**/16/0/0} <t:1680374580:R>`;
				const row2 = `2. [**Sidetracked Day [Infinity Inside]**](https://w) **+NM** [6.80★]\n<:S_:1057763291998474283> ▹ **476.62PP** ▹ (98.74%) ▹ [**2260**x/2261x]\n116,092,230 ▹ {**1660**/32/0/0} <t:1669919430:R>`;
				const row3 = `3. [**My Heart Will Go On [Extra]**](https://w) **+NM** [6.98★]\n<:S_:1057763291998474283> ▹ **462.48PP** ▹ (98.78%) ▹ [**1728**x/1735x]\n68,458,990 ▹ {**1291**/24/0/0} <t:1675276207:R>`;
				const row4 = `4. [**Mynarco [Expert]**](https://w) **+NM** [6.81★]\n<:S_:1057763291998474283> ▹ **403.67PP** ▹ (99.33%) ▹ [**833**x/833x]\n17,896,620 ▹ {**688**/7/0/0} <t:1648837080:R>`;
				const row5 = `5. [**Glory Days [AnedeuwuAAa's Extreme Collab]**](https://w) **+NM **[6.86★]\n<:A_:1057763284327080036> ▹ **391.94PP** ▹ (98.27%) ▹ [**1768**x/2431x]\n64,439,098 ▹ {**1938**/50/0/1} <t:1662056951:R>`;

				const embed = new EmbedBuilder()
					.setColor("Purple")
					.setAuthor({
						name: `YoruNoKen 7450.54pp (#13,554 TR#93) `,
						iconURL: `https://osu.ppy.sh/images/flags/TR.png`,
						url: "https://osu.ppy.sh/users/17279598/osu",
					})
					.setThumbnail("https://a.ppy.sh/17279598?1679428025.jpeg")
					.setFooter({ text: `Page 1/20 | osu!bancho` })
					.setDescription(`${row1}\n${row2}\n${row3}\n${row4}\n${row5}`);
				message.channel.send({ embeds: [embed] });
				return;
			}

			const scoreResponse = await fetch(`${baseURL}/users/${user.id}/scores/best?mode=${mode}&limit=100&offset=0`, { method: "GET", headers }).then((response) => response.json());
			score = scoreResponse;

			if (!user.id) {
				message.reply({
					embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userArgs}\` does not exist in Bancho database**`)],
				});
				return;
			}

			if (score == null) {
				message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No Bancho plays found for **${user.username}**`)] });
				return;
			}
		}

		if (server == "gatari") {
			const baseURL = `https://api.gatari.pw`;
			const [userResponse, userStatsResponse] = await Promise.all([
				fetch(`${baseURL}/users/get?u=${userArgs}`).then((response) => response.json()),
				fetch(`${baseURL}/user/stats?u=${userArgs}&${RuleSetID}`).then((response) => response.json()),
			]);

			user = userResponse.users[0];
			userstats = userStatsResponse.stats;

			const scoreResponse = await fetch(`${baseURL}/user/scores/best?id=${user.id}&l=100&p=1&mode=${RuleSetID}`, { method: "GET" }).then((response) => response.json());
			score = scoreResponse.scores ?? null;
			if (!user) {
				message.reply({
					embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userArgs}\` does not exist in Gatari database**`)],
				});
				return;
			}

			if (!score) {
				message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No Gatari plays found for **${user.username}**`)] });
				return;
			}
		}

		if (args.includes("-am") || args.includes("-g") || args.join(" ").includes("-amount")) {
			let query = "";
			args.forEach((arg, index) => {
				switch (arg) {
					case "-am":
					case "-amount":
					case "-g":
						query = arg;
						break;
					default:
						break;
				}
			});

			const numberIndex = Number(args[args.indexOf(query) + 1]);

			const numberBigger = score.filter((x) => x.pp > numberIndex);

			const embed = new EmbedBuilder()
				.setColor("Purple")
				.setDescription(`${user.username} has **\`${numberBigger.length}\`** plays worth more than ${numberIndex.toFixed(1)}PP`)
				.setFooter({ text: `osu!${server}` });

			message.channel.send({ embeds: [embed] });
			return;
		}

		if (args.includes("-r") || args.includes("-recent")) RB = true;

		message.channel.send({
			embeds: [await GetUserTop(score, user, userstats, pageNumber, mode, RuleSetID, args, argValues["mods"], playNumber, RB, server)],
		});
	});
}

module.exports = { getTop };
