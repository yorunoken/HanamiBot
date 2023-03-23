const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const Table = require("easy-table");

async function PlayStats(user, RuleSetId, mode, prefix) {
	return new Promise((resolve, reject) => {
		fs.readFile("./user-recent.json", async (error, data) => {
			if (error) {
				console.log(error);
				return;
			}
			var Recents = JSON.parse(data);

			var userID = user.id;
			var scores = Recents[userID];

			global_rank = user.statistics.global_rank.toLocaleString() || "-";
			country_rank = user.statistics.country_rank.toLocaleString() || "-";
			pp = user.statistics.pp.toLocaleString();

			if (scores == undefined) {
				const embed = new EmbedBuilder()
					.setColor("Purple")
					.setAuthor({
						name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
						iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
						url: `https://osu.ppy.sh/users/${user.id}/${mode}`,
					})
					.setThumbnail(user.avatar_url)
					.setFields({ name: `Statistics:`, value: `\`\`\`${user.username} does not have any scores collected. type "${prefix}recent ${user.username}" to add to the collection.\`\`\``, inline: false });
				resolve(embed);
				return;
			}

			scores = scores.scores.filter(x => x.mode == mode);

			function FindPattern(Array, Acc) {
				let avg = (Array.reduce((a, b) => a + b) / Array.length).toFixed(2);
				let min = Number(Math.min.apply(null, Array).toFixed(2));
				let max = Number(Math.max.apply(null, Array).toFixed(2));
				if (Acc) {
					avg = ((Array.reduce((a, b) => a + b) / Array.length) * 100).toFixed(2);
					min = (Number(Math.min.apply(null, Array)) * 100).toFixed(2);
					max = (Number(Math.max.apply(null, Array)) * 100).toFixed(2);
				}

				return { avg, min, max };
			}

			const Stars = FindPattern(
				scores.map(score => score.score.StarRating),
				false,
			);
			const Miss = FindPattern(
				scores.map(score => score.score.statistics.count_miss),
				false,
			);
			const Count300 = FindPattern(
				scores.map(score => score.score.statistics.count_300),
				false,
			);
			const Count100 = FindPattern(
				scores.map(score => score.score.statistics.count_100),
				false,
			);
			const Count50 = FindPattern(
				scores.map(score => score.score.statistics.count_50),
				false,
			);
			const bpm = FindPattern(
				scores.map(score => score.score.bpm),
				false,
			);
			const Acc = FindPattern(
				scores.map(score => score.score.accuracy),
				true,
			);
			const Combo = FindPattern(
				scores.map(score => score.score.max_combo),
				false,
			);
			const PPCur = FindPattern(
				scores.map(score => score.score.CurPP),
				false,
			);
			const PPFix = FindPattern(
				scores.map(score => score.score.FixPP),
				false,
			);

			let Passes = [];
			for (let i = 0; i < scores.length; i++) {
				if (scores[i].score.passed) Passes.push(i);
			}
			// const PPSS = FindPattern(scores.map(score => score.score.SSPP))

			const DataForTable = [
				{ name: "Stars", min: Stars.min, avg: Stars.avg, max: Stars.max },
				{ name: "Accuracy", min: Acc.min, avg: Acc.avg, max: Acc.max },
				{ name: "Combo", min: Combo.min, avg: Combo.avg, max: Combo.max },
				{ name: "PP", min: PPCur.min, avg: PPCur.avg, max: PPCur.max },
				{ name: "PP FC", min: PPFix.min, avg: PPFix.avg, max: PPFix.max },
				{ name: "BPM", min: bpm.min, avg: bpm.avg, max: bpm.max },
				{ name: "n300", min: Count300.min, avg: Count300.avg, max: Count300.max },
				{ name: "n100", min: Count100.min, avg: Count100.avg, max: Count100.max },
				{ name: "n50", min: Count50.min, avg: Count50.avg, max: Count50.max },
				{ name: "Miss", min: Miss.min, avg: Miss.avg, max: Miss.max },
			];

			t = new Table();
			DataForTable.forEach(function (Skills) {
				t.cell("", Skills.name);
				t.cell("Minimum", Skills.min);
				t.cell("Average", Skills.avg);
				t.cell("Maximum", Skills.max);
				t.newRow();
			});
			const embed = new EmbedBuilder()
				.setColor("Purple")
				.setAuthor({
					name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
					iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
					url: `https://osu.ppy.sh/users/${user.id}/${mode}`,
				})
				.setThumbnail(user.avatar_url)
				.setFields({ name: `Statistics:`, value: `\`\`\`${t.toString()}Passed    ${Passes.length}/${scores.length}\`\`\`\n**Calculated scores:** \`${scores.length}\``, inline: false });
			resolve(embed);
		});
	});
}

module.exports = { PlayStats };
