const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const { v2, auth } = require("osu-api-extended");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");

const { tools } = require("../../utils/tools.js");
const { mods } = require("../../utils/mods.js");

async function FixFunction(mapinfo, beatmapId, user, ModeOsu, ModsString, message) {
	await auth.login(process.env.client_id, process.env.client_secret);

	try {
		try {
			// formatted values for user
			global_rank = user.statistics.global_rank.toLocaleString();
			country_rank = user.statistics.country_rank.toLocaleString();
			user_pp = user.statistics.pp.toLocaleString();
		} catch (err) {
			global_rank = 0;
			country_rank = 0;
			user_pp = 0;
		}

		console.log("ModsString:", ModsString);

		let status = mapinfo.status.charAt(0).toUpperCase() + mapinfo.status.slice(1);

		let RuleSetId;
		if (ModeOsu == "osu") RuleSetId = 0;
		if (ModeOsu == "taiko") RuleSetId = 1;
		if (ModeOsu == "fruits") RuleSetId = 2;
		if (ModeOsu == "mania") RuleSetId = 3;

		// score set
		const scr = await v2.user.scores.beatmap.all(beatmapId, user.id, ModeOsu);

		let score;
		if (ModsString == undefined) {
			score = scr.scores[0];
		} else {
			try {
				const FilteredScores = scr.scores.filter(obj => obj.mods.sort().join("").toUpperCase() === ModsString.join("").toUpperCase());
				score = FilteredScores[0];
			} catch (err) {
				const FilteredScores = scr.scores.filter(obj => obj.mods.sort().join("").toUpperCase() === ModsString.toUpperCase());
				score = FilteredScores[0];
			}
		}

		try {
			score.mods.join("");
		} catch (err) {
			const embed = new EmbedBuilder().setColor("Purple").setTitle("Error!").setDescription(`**There is no play with that mod combination. Check for spelling errors**`);
			return embed;
		}

		console.log(score);

		if (!fs.existsSync(`./osuBeatmapCache/${beatmapId}.osu`)) {
			console.log("no file.");
			const downloader = new Downloader({
				rootPath: "./osuBeatmapCache",

				filesPerSecond: 0,
			});

			downloader.addSingleEntry(beatmapId);
			await downloader.downloadSingle();
		}
		let map = new Beatmap({ path: `./osuBeatmapCache/${beatmapId}.osu` });

		let ModName = score.mods.join("");
		let modsID;
		if (!ModName.length) {
			ModName = "NM";
			modsID = 0;
		} else {
			modsID = mods.id(ModName);
		}

		let scoreParam = {
			mode: RuleSetId,
		};

		let calc = new Calculator(scoreParam);

		let NormalPP = calc.n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nMisses(Number(score.statistics.count_miss)).combo(score.max_combo).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).mods(modsID).performance(map);

		let row_one = `**${user.username}** already has a **${ModName}** FC worth **${NormalPP.pp.toFixed(2)}pp**`;
		let row_two = "";
		let row_three = "";
		let row_four = "";
		if (NormalPP.effectiveMissCount != 0) {
			const FcAcc = tools.accuracy(
				{
					n300: score.statistics.count_300,
					ngeki: score.statistics.count_geki,
					n100: score.statistics.count_100,
					nkatu: score.statistics.count_katu,
					n50: score.statistics.count_50,
					nmiss: 0,
				},
				ModeOsu,
			);

			//fc pp
			let FcPP = calc.n100(score.statistics.count_100).n300(score.statistics.count_300).nMisses(0).combo(NormalPP.difficulty.maxCombo).n50(score.statistics.count_50).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).mods(modsID).performance(map);

			row_one = `A **${ModName}** FC would have pushed this score from **${NormalPP.pp.toFixed(2)}pp to ${FcPP.pp.toFixed(2)}pp**\n`;
			row_two = `Removed **${score.statistics.count_miss}** misses\n`;
			row_three = `Combo gone up from **${score.max_combo}x** to **${NormalPP.difficulty.maxCombo}x**\n`;
			row_four = `Acc gone up from **${(score.accuracy * 100).toFixed(2)}%** to **${FcAcc.toFixed(2)}%**\n`;
		}

		const row = `${row_one}${row_two}${row_three}${row_four}`;

		//embed
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
				iconURL: `${user.avatar_url}`,
				url: `https://osu.ppy.sh/users/${user.id}`,
			})
			.setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}] [${NormalPP.difficulty.stars.toFixed(2)}★]`)
			.setDescription(row)
			.setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
			.setThumbnail(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/list.jpg`)
			.setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` });

		return embed;
	} catch (err) {
		console.log(err);
	}
}

module.exports = { FixFunction };
