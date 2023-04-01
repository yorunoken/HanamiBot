const { EmbedBuilder } = require("discord.js");
const { FindUserargs } = require("../../utils/exports/finduserargs_export.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	let server = "minecraft";

	var userArgs = await FindUserargs(message, args, server, prefix);
	if (userArgs == undefined) {
		message.channel.send({ embeds: [new EmbedBuilder().setDescription("Link your account")] });
		return;
	}
	if (userArgs.endsWith("!{ENCRYPTED}")) {
		userArgs = userArgs.replace(/!{ENCRYPTED}$/, "");
	}

	/**
	const mojang_base_URL = "https://api.mojang.com/users";
	const mojang_response = await fetch(`${mojang_base_URL}/profiles/minecraft/${userArgs}`).then((res) => res.json());
	const uuid = mojang_response.id; 
    */

	const ranked_base_URL = "https://mcsrranked.com/api";
	const ranked_response = await fetch(`${ranked_base_URL}/users/${userArgs}`).then((res) => res.json());
	const data = ranked_response.data;

	if (ranked_response.status != "success") {
		message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user ${userArgs} does not exist in the database`)] });
		return;
	}

	const avatar_url = `https://mc-heads.net/avatar/${data.uuid}/100.png`;
	const username = data.nickname;
	const curr_elo = data.elo_rate;
	const curr_rank = data.elo_rank;

	const total_plays = data.total_played.toLocaleString();
	const season_plays = data.season_played.toLocaleString();

	const highest_streak = data.highest_winstreak.toLocaleString();
	const curr_streak = data.current_winstreak.toLocaleString();

	const elo_best = data.best_elo_rate.toLocaleString();
	const elo_last_season = data.prev_elo_rate.toLocaleString();

	const total_seconds = data.best_record_time / 1000;
	let minutes = Math.floor(total_seconds / 60);
	let seconds = total_seconds % 60;
	const pb_time = `${minutes.toFixed()}:${seconds.toFixed()}`;

	const last_played_time = new Date(data.latest_time).getTime();

	const seasons_classic = `**Classic**\n**wins:** \`${data.records[1].win}\` **losses:** \`${data.records[1].lose}\` **draws:** \`${data.records[1].draw}\``;
	const seasons_curr = `**Season 1**\n**wins:** \`${data.records[2].win}\` **losses:** \`${data.records[2].lose}\` **draws:** \`${data.records[2].draw}\``;

	const first_row = `**Personal best time:** \`${pb_time}\`\n`;
	const second_row = `**Highest winstreak:** \`${highest_streak}\` • **Current winstreak:** \`${curr_streak}\`\n`;
	const third_row = `**Best elo:** \`${elo_best}\` • **Elo last season:** \`${elo_last_season}\`\n`;
	const fourth_row = `**Total plays:** \`${total_plays}\` • **This season:** \`${season_plays}\`\n`;
	const fifth_row = `**Last played:** <t:${last_played_time}:R>`;
	const embed = new EmbedBuilder()
		.setColor("Purple")
		.setAuthor({
			name: `${username} - ${curr_elo}elo (#${curr_rank})`,
			url: `https://disrespec.tech/elo/?username=${userArgs}`,
		})
		.setThumbnail(avatar_url)
		.setFields(
			{
				name: "Statistics :bar_chart:",
				value: `${first_row}${second_row}${third_row}${fourth_row}${fifth_row}`,
				inline: false,
			},
			{
				name: "\nSeasons <:homi:1083167118385745980>",
				value: `${seasons_classic}\n${seasons_curr}`,
			},
		);
	message.channel.send({ embeds: [embed] });
};
exports.name = "mcsr";
exports.aliases = ["mcsr", "mc", "minecraft", "profile"];
exports.description = ["get mcsr ranked user statistics\n[mcsr ranked website](https://mcsrranked.com/)\n[user profile website](https://disrespec.tech/elo/)"];
exports.usage = [`mcsr yorunoken\nmcsr feinberg`];
exports.category = ["minecraft"];
