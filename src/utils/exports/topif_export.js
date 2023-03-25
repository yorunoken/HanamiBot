const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");

const { tools } = require("../tools.js");
const { mods } = require("../mods.js");

async function GetUserTop(score, user, pageNumber, mode, RuleSetID, modAdd, modRemove, modExact, server, prefix) {
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

	//define the grades
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

	const oldScores = [...score];

	console.log(`to add ${modAdd}`);
	console.log(`to remove ${modRemove}`);
	console.log(`to be exact ${modExact}`);

	let newScores;
	if (modAdd !== undefined) newScores = score.map(obj => ({ ...obj, mods: [...new Set([...obj.mods, ...modAdd])] }));
	if (modRemove !== undefined) newScores = newScores || score.map(obj => ({ ...obj, mods: obj.mods.filter(mod => !modRemove.includes(mod)) }));
	if (modExact !== undefined) newScores = newScores || score.map(obj => ({ ...obj, mods: [modExact] }));

	if (!modAdd && !modRemove && !modExact)
		return new EmbedBuilder()
			.setColor("Purple")
			.setDescription(`Please provide a mod combination. If you're stuck, type "${prefix}help topif" to view parameters.`);

	let newPP = [];
	let oldPP = [];
	let ScoreState = [];
	for (let i = 0; i < newScores.length; i++) {
		const newScore = newScores[i];
		const oldScore = oldScores[i];

		if (!fs.existsSync(`./osuBeatmapCache/${newScore.beatmap.id}.osu`)) {
			console.log(`no file, ${i}`);
			const downloader = new Downloader({
				rootPath: "./osuBeatmapCache",

				filesPerSecond: 0,
				synchronous: true,
			});

			downloader.addSingleEntry(newScore.beatmap.id);
			const DownloaderResponse = await downloader.downloadSingle();
			if (DownloaderResponse.status == -3) {
				throw new Error("ERROR CODE 409, ABORTING TASK");
			}
		}
		let modsID = mods.id(newScore.mods.join(""));
		if (!newScore.mods.join("").length) modsID = 0;

		let scoreParam = {
			mode: RuleSetID,
			mods: modsID,
		};

		let map = new Beatmap({ path: `./osuBeatmapCache/${newScore.beatmap.id}.osu` });

		const ppOldValue = new Calculator(scoreParam)
			.n100(oldScore.statistics.count_100)
			.n300(oldScore.statistics.count_300)
			.n50(oldScore.statistics.count_50)
			.nMisses(oldScore.statistics.count_miss)
			.combo(oldScore.max_combo)
			.nGeki(oldScore.statistics.count_geki)
			.nKatu(oldScore.statistics.count_katu)
			.nMisses(oldScore.statistics.count_miss)
			.performance(map);
		const ppNewValue = new Calculator(scoreParam)
			.n100(newScore.statistics.count_100)
			.n300(newScore.statistics.count_300)
			.n50(newScore.statistics.count_50)
			.nMisses(newScore.statistics.count_miss)
			.combo(newScore.max_combo)
			.nGeki(newScore.statistics.count_geki)
			.nKatu(newScore.statistics.count_katu)
			.nMisses(newScore.statistics.count_miss)
			.performance(map);

		const Play_rank = i;
		newPP.push({ State: i, pp: ppNewValue });
		oldPP.push({ State: i, pp: ppOldValue });
		ScoreState.push({ State: Play_rank, Map: newScore });
	}

	newPP.sort((a, b) => b.pp.pp - a.pp.pp);

	const newPPScores = newPP.map(x => x.pp);
	const newTopPP = newPP.map(x => x.pp.pp);
	const oldTopPP = oldScores.map(x => x.pp);

	const NewTops = newTopPP.map((score, index) => score * Math.pow(0.95, index));
	const OldTops = oldTopPP.map((score, index) => score * Math.pow(0.95, index));

	let weightsNew = [];
	var indexFc = 0;
	newPP.forEach(x => {
		weightsNew.push({ State: x.State, weight: Math.pow(0.95, indexFc) * 100 });
		indexFc++;
	});

	let weightsOld = [];
	var index = 0;
	oldPP.forEach(x => {
		weightsOld.push({ State: x.State, weight: Math.pow(0.95, index) * 100 });
		index++;
	});

	const OldWithoutBonus = OldTops.reduce((a, b) => a + b);
	const BonusPP = user.statistics.pp - OldWithoutBonus;

	const NewWithoutBonus = NewTops.reduce((a, b) => a + b);
	const NewTotal = NewWithoutBonus + BonusPP;

	const oldScoreState = ScoreState.map(x => x.State);
	ScoreState.sort((a, b) => {
		const stateA = weightsNew.find(item => item.State === a.State);
		const stateB = weightsNew.find(item => item.State === b.State);
		return weightsNew.indexOf(stateA) - weightsNew.indexOf(stateB);
	});
	const newScoreState = ScoreState.map(x => x.State);
	const ScoreMap = ScoreState.map(x => x.Map);

	function GetScore(score, modifiedMap, oldState, newState) {
		let modsName = score.mods.join("");
		if (modsName.length == 0) modsName = `NM`;

		let moddedGradeNew = tools.grade({
			n300: score.statistics.count_300,
			n100: score.statistics.count_100,
			n50: score.statistics.count_50,
			nmiss: score.statistics.count_miss,
			nkatu: score.statistics.count_katu,
			ngeki: score.statistics.count_geki,
			mode: mode,
			mods: modsName,
		});

		const ngeki = score.statistics.count_geki;
		const n300 = score.statistics.count_300;
		const nkatu = score.statistics.count_katu;
		const n100 = score.statistics.count_100;
		const n50 = score.statistics.count_50;
		const nmiss = score.statistics.count_miss;

		let AccValues;
		if (RuleSetID == "0") AccValues = `{**${n300}**/${n100}/${n50}/${nmiss}}`;
		if (RuleSetID == "1") AccValues = `{**${n300}**/${n100}/${nmiss}}`;
		if (RuleSetID == "2") AccValues = `{**${n300}**/${n100}/${n50}/${nmiss}}`;
		if (RuleSetID == "3") AccValues = `{**${ngeki}/${n300}**/${nkatu}/${n100}/${n50}/${nmiss}}`;

		let moddedGrade = moddedGradeNew;
		moddedGrade = grades[moddedGrade];

		let grade = score.rank;
		grade = grades[grade];
		const accuracy = `(${(score.accuracy * 100).toFixed(2)}%)`;

		let TimeSet = new Date(score.created_at).getTime() / 1000;

		const row1 = `**${oldState + 1} (\`${newState + 1}\`). [${score.beatmapset.title} [${score.beatmap.version}]](https://osu.ppy.sh/b/${
			score.beatmap.id
		})** \`+${modsName}\` __**[${modifiedMap.difficulty.stars.toFixed(2)}★]**__\n`;
		const row2 = `᲼${moddedGrade} • ${score.pp.toFixed(2)}pp ▸ **${modifiedMap.pp.toFixed(2)}pp** • ${accuracy}\n`;
		const row3 = `᲼᲼[ **${score.max_combo}**x/${modifiedMap.difficulty.maxCombo}x ] • ${AccValues} <t:${TimeSet}:R>`;

		return `${row1}${row2}${row3}`;
	}

	let thing1 = "**No scores found.**";
	let thing2 = "";
	let thing3 = "";
	let thing4 = "";
	let thing5 = "";

	const TotalPage = Math.ceil(score.length / 5);

	if (pageNumber > TotalPage) {
		const embed = new EmbedBuilder().setColor("Purple").setDescription(`Please provide a value not greater than ${TotalPage}`);
		return embed;
	}

	const global_rank = user.statistics.global_rank?.toLocaleString() || "-";
	const country_rank = user.statistics.country_rank?.toLocaleString() || "-";

	const user_pp = user.statistics.pp.toLocaleString();
	const country = user.country_code;
	const useravatar = user.avatar_url;

	userUrl = `https://osu.ppy.sh/users/${user.id}/osu`;

	thing1 = `${GetScore(ScoreMap[one], newPPScores[one], oldScoreState[one], newScoreState[one])}\n` || "";
	thing2 = `${GetScore(ScoreMap[two], newPPScores[two], oldScoreState[two], newScoreState[two])}\n` || "";
	thing3 = `${GetScore(ScoreMap[three], newPPScores[three], oldScoreState[three], newScoreState[three])}\n` || "";
	thing4 = `${GetScore(ScoreMap[four], newPPScores[four], oldScoreState[four], newScoreState[four])}\n` || "";
	thing5 = `${GetScore(ScoreMap[five], newPPScores[five], oldScoreState[five], newScoreState[five])}` || "";

	const userPP = user.statistics.pp.toFixed(2);
	const newUserPP = NewTotal.toFixed(2);
	let difference = (NewTotal - user.statistics.pp).toFixed(2);
	if (difference > 0) {
		difference = `+${difference}`;
	}

	const baseURL = "https://osudaily.net/api/";
	const apiKey = process.env.osudaily_api;

	const response = await fetch(`${baseURL}pp.php?k=${apiKey}&m=${RuleSetID}&t=pp&v=${NewTotal}`, { method: "GET" }).then(response => response.json());
	const approxRank = response.rank.toLocaleString();

	const row = `**Total PP: ${userPP} ▸ ${newUserPP} (${difference})**\n**Approx. rank: #${approxRank}**\n`;

	const embed = new EmbedBuilder()
		.setColor("Purple")
		.setAuthor({
			name: `${user.username}: ${user_pp}pp (#${global_rank} ${country}#${country_rank})`,
			iconURL: `https://osu.ppy.sh/images/flags/${country}.png`,
			url: `${userUrl}`,
		})
		.setThumbnail(useravatar)
		.setDescription(`${row}${thing1}${thing2}${thing3}${thing4}${thing5}`)
		.setFooter({ text: `Page ${pageNumber}/${TotalPage} | osu!${server}` });
	return embed;
}

module.exports = { GetUserTop };
