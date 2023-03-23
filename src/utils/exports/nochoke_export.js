const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const endpoint = `https://osudaily.net/api/`;
const apiKey = process.env.osudaily_api;
const fs = require("fs");

const { tools } = require("../../utils/tools.js");
const { mods } = require("../../utils/mods.js");

async function GetuserNoChoke(user, tops, ruleset, GameMode, pageNumber) {
	try {
		global_rank = user.statistics.global_rank.toLocaleString();
		country_rank = user.statistics.country_rank.toLocaleString();
		TotalPP = user.statistics.pp.toLocaleString();
	} catch (err) {
		global_rank = "0";
		country_rank = "0";
		TotalPP = "0";
	}

	let PPfc = [];
	let PP = [];
	let ScoreState = [];
	for (let i = 0; i < tops.length; i++) {
		const score = tops[i];

		if (!fs.existsSync(`./osuBeatmapCache/${score.beatmap.id}.osu`)) {
			console.log(`no file, ${i}`);
			const downloader = new Downloader({
				rootPath: "./osuBeatmapCache",

				filesPerSecond: 0,
				synchronous: true,
			});

			downloader.addSingleEntry(score.beatmap.id);
			const DownloaderResponse = await downloader.downloadSingle();
			if (DownloaderResponse.status == -3) {
				throw new Error("ERROR CODE 409, ABORTING TASK");
			}
		}
		let modsID = mods.id(score.mods.join(""));
		if (!score.mods.join("").length) modsID = 0;

		let scoreParam = {
			mode: ruleset,
			mods: modsID,
		};

		let map = new Beatmap({ path: `./osuBeatmapCache/${score.beatmap.id}.osu` });

		const pp = new Calculator(scoreParam).n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nMisses(score.statistics.count_miss).combo(score.max_combo).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).nMisses(score.statistics.count_miss).performance(map);
		const ppfc = new Calculator(scoreParam).n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nMisses(0).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).performance(map);

		const Play_rank = i;
		PPfc.push({ State: i, pp: ppfc });
		PP.push({ State: i, pp: pp });
		ScoreState.push({ State: Play_rank, Map: score });
	}

	PPfc.sort((a, b) => b.pp.pp - a.pp.pp);

	const PPFcScores = PPfc.map(x => x.pp);
	const PPFcMap = PPfc.map(x => x.pp.pp);
	const PPMap = PP.map(x => x.pp.pp);

	NewTops = PPFcMap.map((score, index) => score * Math.pow(0.95, index));
	OldTops = PPMap.map((score, index) => score * Math.pow(0.95, index));

	let weightsNew = [];
	var indexFc = 0;
	PPfc.forEach(x => {
		weightsNew.push({ State: x.State, weight: Math.pow(0.95, indexFc) * 100 });
		indexFc++;
	});

	let weightsOld = [];
	var index = 0;
	PP.forEach(x => {
		weightsOld.push({ State: x.State, weight: Math.pow(0.95, index) * 100 });
		index++;
	});

	const NewWithoutBonus = NewTops.reduce((a, b) => a + b);
	const OldWithoutBonus = OldTops.reduce((a, b) => a + b);
	const BonusPP = user.statistics.pp - OldWithoutBonus;

	const NewTotal = NewWithoutBonus + BonusPP;

	const oldScoreState = ScoreState.map(x => x.State);
	ScoreState.sort((a, b) => {
		const stateA = weightsNew.find(item => item.State === a.State);
		const stateB = weightsNew.find(item => item.State === b.State);
		return weightsNew.indexOf(stateA) - weightsNew.indexOf(stateB);
	});
	const newScoreState = ScoreState.map(x => x.State);
	const ScoreMap = ScoreState.map(x => x.Map);

	function GetScore(score, FCMap, oldState, newState) {
		let objects = score.beatmap.count_circles + score.beatmap.count_sliders + score.beatmap.count_spinners;
		Map300CountFc = objects - score.statistics.count_100 - score.statistics.count_50;
		let FcAcc = tools.accuracy(
			{
				n300: Map300CountFc,
				ngeki: score.statistics.count_geki,
				n100: score.statistics.count_100,
				nkatu: score.statistics.count_katu,
				n50: score.statistics.count_50,
				nmiss: 0,
			},
			GameMode,
		);
		let modsName = score.mods.join("");
		if (modsName.length == 0) modsName = `NM`;

		let GradeForFC = tools.grade({
			n300: Map300CountFc,
			n100: score.statistics.count_100,
			n50: score.statistics.count_50,
			nmiss: 0,
			nkatu: score.statistics.count_katu,
			ngeki: score.statistics.count_geki,
			mode: GameMode,
			mods: modsName,
		});

		//grades
		const grades = {
			A: "<:A_:1057763284327080036>",
			B: "<:B_:1057763286097076405>",
			C: "<:C_:1057763287565086790>",
			D: "<:D_:1057763289121173554>",
			F: "<:F_:1057763290484318360>",
			S: "<:S_:1057763291998474283>",
			SH: "<:SH_:1057763293491642568>",
			X: "<:X_:1057763294707974215>",
			XH: "<:XH_:1057763296717045891>",
		};
		let FcGrade = GradeForFC;
		FcGrade = grades[FcGrade];

		let Grade = score.rank;
		Grade = grades[Grade];

		let TimeSet = new Date(score.created_at).getTime() / 1000;

		const row1 = `**${oldState + 1} (\`${newState + 1}\`). [${score.beatmapset.title} [${score.beatmap.version}]](https://osu.ppy.sh/b/${score.beatmap.id})** \`+${modsName}\` __**[${FCMap.difficulty.stars.toFixed(2)}★]**__\n`;
		const row2 = `${Grade} ▸ ${FcGrade} • ${score.pp.toFixed(2)}pp ▸ **${FCMap.pp.toFixed(2)}pp** • (${(score.accuracy * 100).toFixed(2)}% ▸ **${FcAcc.toFixed(2)}%**)\n`;
		const row3 = `[ ${score.max_combo}x ▸ **${FCMap.difficulty.maxCombo}x** ] • Removed ${score.statistics.count_miss}<:hit00:1061254490075955231> <t:${TimeSet}:R>`;

		return `${row1}${row2}${row3}`;
	}

	//determine the page of the osutop
	const start = (pageNumber - 1) * 5 + 1;
	const end = pageNumber * 5;
	const numbers = [];
	for (let i = start; i <= end; i++) {
		numbers.push(i);
	}
	one = numbers[0] - 1;
	two = numbers[1] - 1;
	three = numbers[2] - 1;
	four = numbers[3] - 1;
	five = numbers[4] - 1;

	let thing1 = "No scores.";
	let thing2 = "";
	let thing3 = "";
	let thing4 = "";
	let thing5 = "";

	thing1 = `${GetScore(ScoreMap[one], PPFcScores[one], oldScoreState[one], newScoreState[one])}\n`;
	thing2 = `${GetScore(ScoreMap[two], PPFcScores[two], oldScoreState[two], newScoreState[two])}\n`;
	thing3 = `${GetScore(ScoreMap[three], PPFcScores[three], oldScoreState[three], newScoreState[three])}\n`;
	thing4 = `${GetScore(ScoreMap[four], PPFcScores[four], oldScoreState[four], newScoreState[four])}\n`;
	thing5 = `${GetScore(ScoreMap[five], PPFcScores[five], oldScoreState[five], newScoreState[five])}`;

	const response = await axios.get(`${endpoint}pp.php?k=${apiKey}&m=${ruleset}&t=pp&v=${NewTotal}`);
	const ReponseData = response.data;

	const embed = new EmbedBuilder()
		.setTitle(`What if ${user.username} FCd Their Top 100?`)
		.setColor("Purple")
		.setAuthor({
			name: `${user.username}: ${TotalPP}pp (#${global_rank} ${user.country.code}#${country_rank})`,
			iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
			url: `https://osu.ppy.sh/users/${user.id}/${GameMode}`,
		})
		.setDescription(`**Total PP: ${user.statistics.pp} ▸ ${NewTotal.toFixed(2)} (+${(NewTotal - user.statistics.pp).toFixed(2)})**\n**Approx. Rank: #${ReponseData.rank.toLocaleString()}**\n\n${thing1}${thing2}${thing3}${thing4}${thing5}`);

	return embed;
}

module.exports = { GetuserNoChoke };
