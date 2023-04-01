const { EmbedBuilder } = require("discord.js");
const { FindUserargs } = require("../../utils/exports/finduserargs_export.js");
const fs = require("fs");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	let server = "minecraft";
	let index = 0;
	let ENCRYPTED = false;

	let userArgs = await FindUserargs(message, args, server, prefix);
	if (userArgs == undefined) {
		message.channel.send({ embeds: [new EmbedBuilder().setDescription("Link your account")] });
		return;
	}

	if (args.includes("-i")) {
		index = args[args.indexOf("-i") + 1];
	}

	let filter = "";
	if (args.includes("-casual")) {
		filter = "?filter=3";
	}
	if (args.includes("-ranked")) {
		filter = "?filter=2";
	}

	const unallowed = ["-i", "-ranked", "-casual"];

	fs.readFile("./user-data.json", async (error, data) => {
		const user_data = JSON.parse(data);

		if (unallowed.some((word) => args.join("").startsWith(word))) {
			userArgs = user_data[message.author.id].MinecraftUserID;
		}
		if (userArgs.endsWith("!{ENCRYPTED}")) {
			userArgs = userArgs.replace(/!{ENCRYPTED}$/, "");
			ENCRYPTED = true;
		}

		/**
	    const mojang_base_URL = "https://api.mojang.com/users";
	    const mojang_response = await fetch(`${mojang_base_URL}/profiles/minecraft/${userArgs}`).then((res) => res.json());
	    const uuid = mojang_response.id; 
        */

		const ranked_base_URL = "https://mcsrranked.com/api";
		const ranked_response = await fetch(`${ranked_base_URL}/users/${userArgs}/matches${filter}`).then((res) => res.json());
		const ranked_data = ranked_response.data;

		if (ranked_response.status != "success") {
			message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user ${userArgs} does not exist in the database`)] });
			return;
		}

		message.channel.send({ embeds: [getMatch(ranked_data[index])] });
	});

	function getMatch(data) {
		console.log(data);

		/**
        this switch function takes the array, and rearranges them so the first user is the user typed the command
        */
		switch (ENCRYPTED) {
			case true:
				data.members.sort((a, b) => {
					if (a.uuid === userArgs) {
						return -1; // put User to the top
					}
					if (b.uuid === userArgs) {
						return 1; // put User to the top
					}
					return 0; // don't change the other elements
				});

				if (data.match_type == 2) {
					data.score_changes.sort((a, b) => {
						if (a.uuid === userArgs) {
							return -1; // put User to the top
						}
						if (b.uuid === userArgs) {
							return 1; // put User to the top
						}
						return 0; // don't change the other elements
					});
				}

				break;
			case false:
				console.log("false");
				data.members.sort((a, b) => {
					if (a.nickname.toLowerCase() === userArgs.toLowerCase()) {
						return -1; // put User to the top
					}
					if (b.nickname.toLowerCase() === userArgs.toLowerCase()) {
						return 1; // put User to the top
					}
					return 0; // don't change the other elements
				});

				if (data.match_type == 2) {
					const first_member_uuid = data.members[0].uuid;
					data.score_changes.sort((a, b) => {
						if (a.uuid === first_member_uuid) {
							return -1; // put User to the top
						}
						if (b.uuid === first_member_uuid) {
							return 1; // put User to the top
						}
						return 0; // don't change the other elements
					});
				}
				break;
		}

		const user_avatar_url = `https://mc-heads.net/avatar/${data.members[0].uuid}/100.png`;
		const user_username = data.members[0].nickname;
		const user_curr_elo = data.members[0].elo_rate;
		const user_curr_rank = data.members[0].elo_rank;

		const opponent_username = data.members[1].nickname;
		const opponent_curr_elo = data.members[1].elo_rate;
		const opponent_curr_rank = data.members[1].elo_rank;

		const total_seconds = data.final_time / 1000;
		let minutes = Math.floor(total_seconds / 60);
		let seconds = total_seconds % 60;
		const match_duration = `${minutes.toFixed()}:${seconds.toFixed()}`;

		const match_seed = data.match_seed;
		const match_date = new Date(1680292365).getTime();

		let match_status;
		switch (data.winner) {
			case undefined || null:
				match_status = "The match was a draw";
			default:
				const winner_uuid = data.winner;
				const winner_object = data.members.find((member) => member.uuid === winner_uuid);
				const winner_nickname = winner_object.nickname;
				match_status = `\`${winner_nickname}\` won the match`;
		}

		let forfeit = "";
		if (data.forfeit) {
			forfeit = ` (forfeit)`;
		}

		let user_elo_change;
		let opponent_elo_change;
		if (data.score_changes == null) {
			user_elo_change = `**Elo change:** [\`<?>\`](https://mcsrranked.com "the question mark here indicates that there was no elo change because the match type isn't ranked")\n**Score:** [\`<?>\`](https://mcsrranked.com "the question mark here indicates that there was no score because the match type isn't ranked")\n[User profile](https://disrespec.tech/elo/?username=${user_username})`;
			opponent_elo_change = `**Elo change:** [\`<?>\`](https://mcsrranked.com "the question mark here indicates that there was no elo change because the match type isn't ranked")\n**Score:** [\`<?>\`](https://mcsrranked.com "the question mark here indicates that there was no score because the match type isn't ranked")\n[User profile](https://disrespec.tech/elo/?username=${opponent_username})`;
		} else {
			user_elo_change = `**Elo change:** \`${data.score_changes[0].change}\`\n**Score:** \`${data.score_changes[0].score}\`\n[User profile](https://disrespec.tech/elo/?username=${user_username})`;
			opponent_elo_change = `**Elo change:** \`${data.score_changes[1].change}\`\n**Score:** \`${data.score_changes[1].score}\`\n[User profile](https://disrespec.tech/elo/?username=${user_username})`;
		}

		let match_type;
		switch (data.match_type) {
			case 2:
				match_type = "Ranked";
				break;
			case 3:
				match_type = "Casual";
				break;
		}

		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `Seed: ${match_seed}`,
				url: `https://mcseeder.com/?seed=${match_seed}&version=16`,
			})
			.setDescription(`**Match type: ${match_type}**\n**Match status: ${match_status}**\n**Match duration:** \`${match_duration}\`${forfeit}\n**Match date:** <t:${match_date}:R>`)
			.setFields(
				{
					name: `${user_username} - ${user_curr_elo}elo (#${user_curr_rank})`,
					value: user_elo_change,
					inline: true,
				},
				{
					name: `${opponent_username} - ${opponent_curr_elo}elo (#${opponent_curr_rank})`,
					value: opponent_elo_change,
					inline: true,
				},
			)
			.setThumbnail(user_avatar_url);
		return embed;
	}
};
exports.name = "matches";
exports.aliases = ["matches", "matchrecent", "rr", "rankr", "ranked", "mcrecent", "mcr", "matches"];
exports.description = [
	'get a recent mcsr ranked match\n\n**Parameters**\n`username` username of the player you want to get the recent match of. Can be blank but you need to link your account by typing "{prefix}link {userame} server=minecraft"\n`-i (number)` replace (number) with whichever recent match you want, defaults to 1. 2 means 2nd recent match 3 means 3rd etc.\n`-casual` gets the latest casual match\n`-ranked` gets the latest ranked match\n[mcsr ranked website](https://mcsrranked.com/)\n[user profile website](https://disrespec.tech/elo/)',
];
exports.usage = [`matches yorunoken\nranked feinberg -i 4\nranked specnr -casual -i 1`];
exports.category = ["minecraft"];
