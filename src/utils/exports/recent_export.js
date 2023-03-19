const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const { v2, auth } = require("osu-api-extended");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");
const axios = require("axios");

const { tools } = require("../../utils/calculators/tools.js");
const { mods } = require("../../utils/calculators/mods.js");

async function GetRecent(value, user, mode, PassDetermine, args, RuleSetId, userstats, server) {
	await auth.login(process.env.client_id, process.env.client_secret);

	let top1k = false;
	let score_id;
	let argValues = {};
	for (const arg of args) {
		const [key, value] = arg.split("=");
		argValues[key] = value;
	}

	if (args.join(" ").includes("+")) {
		const iIndex = args.indexOf("+");
		modsArg = args[iIndex + 1]
			.slice(1)
			.toUpperCase()
			.match(/[A-Z]{2}/g);
		argValues["mods"] = modsArg.join("");
	}

	let FilterMods = "";
	let ScoreGlobalRank = "";
	let replayLink = "";
	let score, filteredscore, ModsName, mapId, retryMap, global_rank, country_rank, user_pp, acc, objects, TimeCreated, grade, title, hitLength, totalLength, CountryCode, profileUrl, MapsetId, avatarUrl, creatorName, creatorUserId;
	let valuegeki,
		value300,
		valuekatu,
		value100,
		value50,
		valuemiss,
		valuecombo = 0;

	if (server == "gatari") {
		var url = `https://api.gatari.pw/user/scores/recent`;
		const response = await axios.get(`${url}?id=${user.id}&l=100&p=1&mode=${RuleSetId}&f=${PassDetermine}`);

		score = response.data.scores;
		if (score == null) {
			let embed = new EmbedBuilder().setColor("Purple").setDescription(`No recent Gatari plays found for **${user.username}**`);
			return { embed, FilterMods };
		}

		mapId = score[value].beatmap.beatmap_id;
		ModsName = mods.name(score[value].mods).toUpperCase();

		if (argValues["mods"] != undefined) {
			filteredscore = score.filter(x => mods.name(x.mods).toLowerCase() == argValues["mods"].split("").sort().join("").toLowerCase());
			score = filteredscore;
			try {
				FilterMods = `**Filtering mod(s): ${mods.name(score[value].mods).toUpperCase()}**`;
			} catch (err) {
				const embed = new EmbedBuilder().setColor("Purple").setDescription("Please provide a valid mod combination.");
				return embed;
			}
		}

		valuegeki = score[value].count_gekis;
		value300 = score[value].count_300;
		valuekatu = score[value].count_katu;
		value100 = score[value].count_100;
		value50 = score[value].count_50;
		valuemiss = score[value].count_miss;
		valuecombo = score[value].max_combo;

		retryMap = score.map(x => x.beatmap.beatmap_id);
		retryMap.splice(0, value);

		//formatted values for user
		try {
			global_rank = userstats.rank.toLocaleString();
			country_rank = userstats.country_rank.toLocaleString();
		} catch (err) {
			global_rank = 0;
			country_rank = 0;
		}
		user_pp = userstats.pp.toLocaleString();
		CountryCode = user.country;
		profileUrl = `https://osu.gatari.pw/u/${user.id}?m=${RuleSetId}`;
		avatarUrl = `https://a.gatari.pw/${user.id}`;
		MapsetId = score[value].beatmap.beatmapset_id;

		acc = `**(${Number(score[value].accuracy).toFixed(2)}%)**`;

		var MapAkatsuki = await v2.beatmap.diff(mapId);
		objects = MapAkatsuki.count_circles + MapAkatsuki.count_sliders + MapAkatsuki.count_spinners;

		TimeCreated = new Date(score[value].time).getTime();
		grade = score[value].ranking;
		title = `${MapAkatsuki.beatmapset.artist} - ${MapAkatsuki.beatmapset.title} [${MapAkatsuki.version}]`;

		hitLength = MapAkatsuki.hit_length;
		totalLength = MapAkatsuki.total_length;

		if (score[value].beatmap.ranked == 0) MapStatus = `Unranked`;
		if (score[value].beatmap.ranked == 2) MapStatus = `Ranked`;
		if (score[value].beatmap.ranked == 3) MapStatus = `Approved`;
		if (score[value].beatmap.ranked == 4) MapStatus = `Qualified`;
		if (score[value].beatmap.ranked == 5) MapStatus = `Loved`;

		creatorUserId = MapAkatsuki.beatmapset.user_id;
		creatorName = MapAkatsuki.beatmapset.creator;
	}

	if (server == "akatsuki") {
		var BaseUrl = `https://akatsuki.pw/api/v1`;
		var response = await axios.get(`${BaseUrl}/users/scores/recent?id=${user.id}&mode=${RuleSetId}`);

		score = response.data.scores;
		if (response.data.code != 200 || score == null) {
			let embed = new EmbedBuilder().setColor("Purple").setDescription(`No recent Gatari plays found for **${user.username}**`);
			return { embed, FilterMods };
		}

		mapId = score[value].beatmap.beatmap_id;
		ModsName = mods.name(score[value].mods).toUpperCase();

		if (argValues["mods"] != undefined) {
			filteredscore = score.filter(x => mods.name(x.mods).toLowerCase() == argValues["mods"].split("").sort().join("").toLowerCase());
			score = filteredscore;
			try {
				FilterMods = `**Filtering mod(s): ${mods.name(score[value].mods).toUpperCase()}**`;
			} catch (err) {
				const embed = new EmbedBuilder().setColor("Purple").setDescription("Please provide a valid mod combination.");
				return embed;
			}
		}

		valuegeki = score[value].count_geki;
		value300 = score[value].count_300;
		valuekatu = score[value].count_katu;
		value100 = score[value].count_100;
		value50 = score[value].count_50;
		valuemiss = score[value].count_miss;
		valuecombo = score[value].max_combo;

		retryMap = score.map(x => x.beatmap.beatmap_id);
		retryMap.splice(0, value);

		let uStats = user.stats[0].std;
		if (mode == "taiko") uStats = user.stats[0].taiko;
		if (mode == "fruits") uStats = user.stats[0].ctb;
		if (mode == "mania") uStats = user.stats[0].mania;

		global_rank = uStats.global_leaderboard_rank?.toLocaleString() || "-";
		country_rank = uStats.country_leaderboard_rank?.toLocaleString() || "-";
		user_pp = uStats.pp.toLocaleString();

		CountryCode = user.country;
		profileUrl = `https://osu.akatsuki.pw/u/${user.id}?m=${RuleSetId}`;
		avatarUrl = `https://a.akatsuki.pw/${user.id}`;
		MapsetId = score[value].beatmap.beatmapset_id;

		acc = `**(${Number(score[value].accuracy).toFixed(2)}%)**`;

		var MapAkatsuki = await v2.beatmap.diff(mapId);
		objects = MapAkatsuki.count_circles + MapAkatsuki.count_sliders + MapAkatsuki.count_spinners;

		TimeCreated = new Date(score[value].time).getTime() / 1000;
		grade = score[value].rank;

		if (score[value].completed == 0) {
			grade = "F";
		}
		title = `${MapAkatsuki.beatmapset.artist} - ${MapAkatsuki.beatmapset.title} [${MapAkatsuki.version}]`;

		hitLength = MapAkatsuki.hit_length;
		totalLength = MapAkatsuki.total_length;

		if (score[value].beatmap.ranked == 0) MapStatus = `Unranked`;
		if (score[value].beatmap.ranked == 2) MapStatus = `Ranked`;
		if (score[value].beatmap.ranked == 3) MapStatus = `Approved`;
		if (score[value].beatmap.ranked == 4) MapStatus = `Qualified`;
		if (score[value].beatmap.ranked == 5) MapStatus = `Loved`;

		creatorUserId = MapAkatsuki.beatmapset.user_id;
		creatorName = MapAkatsuki.beatmapset.creator;
	}

	if (server == "bancho") {
		score = await v2.user.scores.category(user.id, "recent", {
			include_fails: PassDetermine,
			mode: mode,
			limit: "100",
			offset: "0",
		});

		try {
			mapId = score[value].beatmap.id;
		} catch (err) {
			let embed = new EmbedBuilder().setColor("Purple").setDescription(`No recent Bancho plays found for **${user.username}**`);
			return { embed, FilterMods };
		}
		ModsName = score[value].mods.join("").toUpperCase();

		if (argValues["mods"] != undefined) {
			filteredscore = score.filter(x => x.mods.join("").split("").sort().join("").toLowerCase() == argValues["mods"].split("").sort().join("").toLowerCase());
			score = filteredscore;
			try {
				FilterMods = `**Filtering mod(s): ${score[value].mods.join("").toUpperCase()}**`;
			} catch (err) {
				const embed = new EmbedBuilder().setColor("Purple").setDescription("Please provide a valid mod combination.");
				return embed;
			}
		}

		valuegeki = score[value].statistics.count_geki;
		value300 = score[value].statistics.count_300;
		valuekatu = score[value].statistics.count_katu;
		value100 = score[value].statistics.count_100;
		value50 = score[value].statistics.count_50;
		valuemiss = score[value].statistics.count_miss;
		valuecombo = score[value].max_combo;

		//formatted values for user
		try {
			global_rank = user.statistics.global_rank.toLocaleString();
			country_rank = user.statistics.country_rank.toLocaleString();
		} catch (err) {
			global_rank = 0;
			country_rank = 0;
		}
		user_pp = user.statistics.pp.toLocaleString();
		CountryCode = user.country_code;
		profileUrl = `https://osu.ppy.sh/users/${user.id}/${mode}`;
		avatarUrl = user.avatar_url;
		MapsetId = score[value].beatmapset.id;

		acc = `**(${Number(score[value].accuracy * 100).toFixed(2)}%)**`;
		objects = score[value].beatmap.count_circles + score[value].beatmap.count_sliders + score[value].beatmap.count_spinners;

		TimeCreated = new Date(score[value].created_at).getTime() / 1000;
		grade = score[value].rank;
		title = `${score[value].beatmapset.artist} - ${score[value].beatmapset.title} [${score[value].beatmap.version}]`;

		// retry counter
		retryMap = score.map(x => x.beatmap.id);
		retryMap.splice(0, value);

		hitLength = score[value].beatmap.hit_length;
		totalLength = score[value].beatmap.total_length;

		if (score[value].passed == true) {
			let scorerank = await v2.scores.details(score[value].best_id, mode);
			if (scorerank.created_at == score[value].created_at) {
				if (scorerank.rank_global != undefined) {
					ScoreGlobalRank = ` 🌐 #${scorerank.rank_global}`;
				}
				if (scorerank.rank_global < 1000) {
					top1k = true;
					score_id = scorerank.best_id;
					replayLink = ` • [Replay](https://osu.ppy.sh/scores/${mode}/${scorerank.id}/download)`;
				}
			}
		}

		MapStatus = score[value].beatmapset.status.charAt(0).toUpperCase() + score[value].beatmapset.status.slice(1);
		creatorUserId = score[value].beatmapset.user_id;
		creatorName = score[value].beatmapset.creator;
	}

	if (!fs.existsSync(`./osuBeatmapCache/${mapId}.osu`)) {
		console.log("no file.");
		const downloader = new Downloader({
			rootPath: "./osuBeatmapCache",

			filesPerSecond: 0,
		});

		downloader.addSingleEntry(mapId);
		await downloader.downloadSingle();
	}

	let ModDisplay = `**+${ModsName}**`;
	let modsID = mods.id(ModsName);

	if (!ModsName.length) {
		ModDisplay = "";
		modsID = 0;
	}

	console.log(modsID);

	let scoreParam = {
		mode: RuleSetId,
		mods: modsID,
	};

	let map = new Beatmap({ path: `./osuBeatmapCache/${mapId}.osu` });
	let calc = new Calculator(scoreParam);

	const mapValues = calc.mapAttributes(map);

	// ss pp
	let maxAttrs = calc.performance(map);

	//normal pp
	let CurAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(valuemiss).combo(valuecombo).nGeki(valuegeki).nKatu(valuekatu).performance(map);

	//fc pp
	let FCAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(0).combo(maxAttrs.difficulty.maxCombo).nGeki(valuegeki).nKatu(valuekatu).performance(map);

	function getRetryCount(retryMap, mapId) {
		let retryCounter = 0;
		for (let i = 0; i < retryMap.length; i++) {
			if (retryMap[i] === mapId) {
				retryCounter++;
			}
		}
		return retryCounter;
	}

	const retryCounter = getRetryCount(retryMap, mapId);

	if (RuleSetId == "0") AccValues = `{**${value300}**/${value100}/${value50}/${valuemiss}}`;
	if (RuleSetId == "1") AccValues = `{**${value300}**/${value100}/${valuemiss}}`;
	if (RuleSetId == "2") AccValues = `{**${value300}**/${value100}/${value50}/${valuemiss}}`;
	if (RuleSetId == "3") AccValues = `{**${valuegeki}/${value300}**/${valuekatu}/${value100}/${value50}/${valuemiss}}`;

	//formatted values for score
	let map_score = score[value].score.toLocaleString();

	let objectshit = value300 + value100 + value50 + valuemiss;

	let fraction = objectshit / objects;
	let percentage_raw = Number((fraction * 100).toFixed(2));
	let percentagenum = percentage_raw.toFixed(1);
	let percentage = `**(${percentagenum}%)** `;
	if (percentagenum == "100.0" || score[value].passed == true) {
		percentage = " ";
	}

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
	grade = grades[grade];

	pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`;
	if (CurAttrs.effectiveMissCount > 0) {
		Map300CountFc = objects - value100 - value50;

		const FcAcc = tools.accuracy(
			{
				n300: Map300CountFc,
				ngeki: valuegeki,
				n100: value100,
				nkatu: valuekatu,
				n50: value50,
				nmiss: 0,
			},
			mode,
		);

		pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP ▹ (**${FCAttrs.pp.toFixed(2)}**PP for **${FcAcc.toFixed(2)}%**)`;
	}

	let Hit, Total;

	if (ModsName.toLowerCase().includes("dt")) {
		Hit = (hitLength / 1.5).toFixed();
		Total = (totalLength / 1.5).toFixed();
	} else {
		Hit = hitLength;
		Total = totalLength;
	}

	//length
	let minutesHit = Math.floor(Hit / 60).toFixed();
	let secondsHit = (Hit % 60).toString().padStart(2, "0");
	let minutesTotal = Math.floor(Total / 60).toFixed();
	let secondsTotal = (Total % 60).toString().padStart(2, "0");

	//score embed
	const embed = new EmbedBuilder()
		.setColor("Purple")
		.setAuthor({
			name: `${user.username} ${user_pp}pp (#${global_rank} ${CountryCode}#${country_rank}) `,
			iconURL: `https://osu.ppy.sh/images/flags/${CountryCode}.png`,
			url: profileUrl,
		})
		.setTitle(title)
		.setURL(`https://osu.ppy.sh/b/${mapId}`)
		.setDescription(`${grade} ${percentage}${ModDisplay} • **__[${maxAttrs.difficulty.stars.toFixed(2)}★]__** ${ScoreGlobalRank}\n▹${pps} \n▹${map_score} • ${acc}\n▹[ **${score[value].max_combo}**x/${maxAttrs.difficulty.maxCombo}x ] • ${AccValues} ${replayLink}\n▹Score Set <t:${TimeCreated}:R> • **Try #${retryCounter}**`)
		.setFields({ name: `**Beatmap info:**`, value: `BPM: \`${mapValues.bpm.toFixed()}\` Objects: \`${objects.toLocaleString()}\` Length: \`${minutesTotal}:${secondsTotal}\` (\`${minutesHit}:${secondsHit}\`)\nAR: \`${mapValues.ar.toFixed(1).toString().replace(/\.0+$/, "")}\` OD: \`${mapValues.od.toFixed(1).toString().replace(/\.0+$/, "")}\` CS: \`${mapValues.cs.toFixed(1).toString().replace(/\.0+$/, "")}\` HP: \`${mapValues.hp.toFixed(2).toString().replace(/\.0+$/, "")}\`` })
		.setImage(`https://assets.ppy.sh/beatmaps/${MapsetId}/covers/cover.jpg`)
		.setThumbnail(avatarUrl)
		.setFooter({ text: `${MapStatus} map by ${creatorName} | osu!${server}`, iconURL: `https://a.ppy.sh/${creatorUserId}?1668890819.jpeg` });

	fs.readFile("./user-recent.json", (error, data) => {
		if (error) {
			console.log(error);
			return;
		}

		//update the user's osu! recent in the JSON file
		const userData = JSON.parse(data);

		score[value] = { ...score[value], StarRating: maxAttrs.difficulty.stars, CurPP: CurAttrs.pp, FixPP: FCAttrs.pp, SSPP: maxAttrs.pp, bpm: mapValues.bpm, mode: mode };

		if (userData[user.id]) {
			if (userData[user.id].scores.findIndex(ScoreArr => ScoreArr.score.id == score[value].id) != -1) {
			} else
				userData[user.id].scores.push({
					score: score[value],
					StarRating: maxAttrs.difficulty.stars,
					CurPP: CurAttrs.pp,
					FixPP: FCAttrs.pp,
					SSPP: maxAttrs.pp,
					bpm: mapValues.bpm,
					mode: mode,
				});
		} else {
			userData[user.id] = {
				scores: [
					{
						score: score[value],
						StarRating: maxAttrs.difficulty.stars,
						CurPP: CurAttrs.pp,
						FixPP: FCAttrs.pp,
						SSPP: maxAttrs.pp,
						bpm: mapValues.bpm,
						mode: mode,
					},
				],
				server: server,
			};
		}
		fs.writeFile("./user-recent.json", JSON.stringify(userData, null, 2), error => {
			if (error) {
				console.log(error);
				return;
			}
		});
	});
	return { embed, FilterMods, top1k, score_id };
}

module.exports = { GetRecent };
