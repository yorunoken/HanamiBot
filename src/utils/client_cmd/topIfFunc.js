const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

// importing top
const { GetUserTop } = require("../exports/topif_export.js");
const { FindUserargs } = require("../exports/finduserargs_export.js");

function getTop(message, args, prefix, mode, ruleSetID) {
	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error);
			return;
		}
		const userData = JSON.parse(data);

		let modsToAdd, modsToRemove, modsExact;
		function parseArgs(args) {
			const result = {};

			result.pageNumber = 1;
			result.server = userData[message.author.id]?.server || "bancho";

			if (args.includes("-p")) {
				result.pageNumber = args[args.indexOf("-p") + 1];
				if (result.pageNumber > 20) {
					throw new Error("Value must not be greater than 20");
				}
			}

			if (args.includes("-bancho")) {
				result.server = "bancho";
			}

			if (args.includes("-gatari")) {
				result.server = "gatari";
			}

			return result;
		}

		const options = parseArgs(args);
		var PageNumber = options.pageNumber;
		var server = options.server;

		if (args.join("").includes("+")) {
			modsToAdd =
				args[args.indexOf("+") + 1]
					.slice(1)
					.toUpperCase()
					.match(/[A-Z]{2}/g) || [];
		}

		if (args.join("").includes("-")) {
			modsToRemove =
				args[args.indexOf("-") + 1]
					.slice(1)
					.toUpperCase()
					.match(/[A-Z]{2}/g) || [];
		}

		if (args.join("").includes("!")) {
			modsExact = args[args.indexOf("!") + 1]
				.slice(1)
				.toUpperCase()
				.match(/[A-Z]{2}/g);
			if (modsExact && modsExact.join("").includes("NM")) modsExact = [""];
		}

		const unAllowed = ["-page", "-p", "-r", "-i", "!", "-", "+", "-rev", "-reverse"];
		var userArgs = await FindUserargs(message, args, server, prefix);

		if (unAllowed.some(string => args.join("").startsWith(string))) {
			try {
				if (server == "bancho") userArgs = userData[message.author.id].BanchoUserId;
				if (server == "gatari") userArgs = userData[message.author.id].GatariUserId;
			} catch (err) {
				message.reply({
					embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Set your osu! username by typing "${prefix}link **your username**"`)],
				});
			}
		}

		const headers = {
			Authorization: `Bearer ${process.env.osu_bearer_key}`,
		};
		const baseURL = `https://osu.ppy.sh/api/v2`;

		const [userResponse, scoreResponse] = await Promise.all([
			fetch(`${baseURL}/users/${userArgs}/${mode}`, { headers }).then(response => response.json()),
			fetch(`${baseURL}/users/${userArgs}/scores/best?mode=${mode}&limit=100&offset=0`, { headers }).then(response => response.json()),
		]);
		const user = userResponse || {};
		const score = scoreResponse || [];

		if (!user) {
			message.reply({
				embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userArgs}\` does not exist in Bancho database**`)],
			});
			return;
		}

		if (score.length === 0) {
			message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No Bancho plays found for **${user.username}**`)] });
			return;
		}

		message.channel.send({
			embeds: [await GetUserTop(score, user, PageNumber, mode, ruleSetID, modsToAdd, modsToRemove, modsExact, server, prefix)],
		});
	});
}

module.exports = { getTop };
