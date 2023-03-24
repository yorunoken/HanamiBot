const { EmbedBuilder } = require("discord.js");

async function GetLeaderboardCount(user) {
	const userName = user.username;
	const userID = user.userID;
	const userAvatar = user.avatar_url;
	const globalRank = user.statistics.global_rank?.toLocaleString() || "-";
	const countryRank = user.statistics.country_rank?.toLocaleString() || "-";
	const pp = user.statistics.pp.toLocaleString();
	const countryCode = user.country_code;

	const params = {
		username: userName,
	};

	let form = new FormData();
	form.append("u1", params.username);

	let url = "https://osustats.ppy.sh/api/getScores";
	var response = await fetch(url, { method: "POST", body: form });
	const data = await response.json();
	const scores = data[0];

	const leaderboardCounts = [];
	const positions = [1, 8, 15, 25, 50, 100];
	for (let i = 0; i < positions.length; i++) {
		const position = positions[i];
		const rank = scores.filter(x => x.position <= position).length;
		leaderboardCounts.push(`**Top ${position}:** \`${rank}\``);
	}

	const embed = new EmbedBuilder()
		.setColor("Purple")
		.setAuthor({
			name: `${userName} ${pp}pp (#${globalRank} ${countryCode}#${countryRank}) `,
			iconURL: `https://osu.ppy.sh/images/flags/${countryCode}.png`,
			url: `https://osu.ppy.sh/users/${userID}`,
		})
		.setTitle(`How many leaderboards is ${userName} in?`)
		.setDescription(leaderboardCounts.join("\n"))
		.setThumbnail(userAvatar);
	return embed;
}

module.exports = { GetLeaderboardCount };
