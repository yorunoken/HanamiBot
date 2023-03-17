const { v2, auth } = require("osu-api-extended")
const { EmbedBuilder } = require("discord.js")

async function GetUserPage(firstPage, user, userstats, mode, RuleSetId, server) {
	//grades
	const grades = {
		A: "<:A_:1057763284327080036>",
		S: "<:S_:1057763291998474283>",
		SH: "<:SH_:1057763293491642568>",
		X: "<:X_:1057763294707974215>",
		XH: "<:XH_:1057763296717045891>",
	}

	const options = {
		hour: "2-digit",
		minute: "2-digit",
		year: "numeric",
		month: "numeric",
		day: "numeric",
		timeZone: "UTC",
	}

	if (server == "gatari") {
		try {
			global_rank = userstats.rank.toLocaleString()
			country_rank = userstats.country_rank.toLocaleString()
			pp = userstats.pp.toLocaleString()
		} catch (err) {
			global_rank = "0"
			country_rank = "0"
			pp = "0"
		}

		try {
			acc = userstats.avg_accuracy.toFixed(2)
		} catch (err) {
			acc = 0
		}
		UserLevel = userstats.level
		lvl = userstats.level_progress
		lvlprogress = lvl.toString(10).padStart(2, "0")
		playcount = userstats.playcount.toLocaleString()
		playhours = userstats.playtime.toFixed(4) / 3600
		followers = user.followers_count.toLocaleString()
		profile_maxcombo = userstats.max_combo.toLocaleString()

		//ranks
		let ssh = userstats.xh_count.toLocaleString()
		let ss = userstats.x_count.toLocaleString()
		let sh = userstats.s_count.toLocaleString()
		let s = userstats.s_count.toLocaleString()
		let a = userstats.a_count.toLocaleString()

		//join date
		const dateString = user.registered_on * 1000
		const date = new Date(dateString)
		//current time
		const currenttime = new Date()
		const timedifference = currenttime - date
		//convert the time difference to months
		const months = Math.floor(timedifference / (1000 * 60 * 60 * 24 * 30))
		const user_joined = months / 12
		const user_joined_ago = user_joined.toFixed(1)

		const formattedDate = date.toLocaleDateString("en-US", options)

		//embed
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username}[${user.abbr}]: ${pp}pp (#${global_rank} ${user.country}#${country_rank})`,
				iconURL: `https://osu.ppy.sh/images/flags/${user.country}.png`,
				url: `https://osu.gatari.pw/u/${user.id}?m=${RuleSetId}`,
			})
			.setThumbnail(`https://a.gatari.pw/${user.id}`)
			.setDescription(`**Accuracy:** \`${acc}%\` •  **Level:** \`${UserLevel}.${lvlprogress}\`\n**Playcount:** \`${playcount}\` (\`${playhours.toFixed()} hrs\`)\n**Followers:** \`${followers}\` • **Max Combo:** \`${profile_maxcombo}\`\n**Ranks:** ${grades.XH}\`${ssh}\`${grades.X}\`${ss}\`${grades.SH}\`${sh}\`${grades.S}\`${s}\`${grades.A}\`${a}\``)
			.setImage(user.cover_url)
			.setFooter({
				text: `Joined osu!${server} ${formattedDate} (${user_joined_ago} years ago)`,
			})
		return embed
	}

	if (server == "akatsuki") {
		let uStats = user.stats[0].std
		if (mode == "taiko") uStats = user.stats[0].taiko
		if (mode == "fruits") uStats = user.stats[0].ctb
		if (mode == "mania") uStats = user.stats[0].mania

		global_rank = uStats.global_leaderboard_rank?.toLocaleString() || "-"
		country_rank = uStats.country_leaderboard_rank?.toLocaleString() || "-"
		pp = uStats.pp.toLocaleString() || "0"
		acc = uStats.accuracy.toFixed(2) || "0"

		UserLevel = uStats.level.toFixed(2)
		playcount = uStats.playcount.toLocaleString()
		playhours = uStats.playtime.toFixed(4) / 3600
		followers = user.followers.toLocaleString()
		profile_maxcombo = uStats.max_combo.toLocaleString()

		const date = new Date(user.registered_on)
		const currenttime = new Date()
		const timedifference = currenttime - date
		const months = Math.floor(timedifference / (1000 * 60 * 60 * 24 * 30))
		const user_joined = months / 12
		const user_joined_ago = user_joined.toFixed(1)

		const formattedDate = date.toLocaleDateString("en-US", options)

		var clan = user.clan
		let clanTag = `[${clan.tag}]`
		let clanName = clan.name
		if (clan.id == 0) {
			clanTag = ""
			clanName = "None"
		}

		//embed
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username}${clanTag}: ${pp}pp (#${global_rank} ${user.country}#${country_rank})`,
				iconURL: `https://osu.ppy.sh/images/flags/${user.country}.png`,
				url: `https://osu.akatsuki.pw/u/${user.id}?mode=${RuleSetId}&rx=0`,
			})
			.setThumbnail(`https://a.akatsuki.pw/${user.id}`)
			.setDescription(`**Clan:** \`${clanName}\`\n**Accuracy:** \`${acc}%\` •  **Level:** \`${UserLevel}\`\n**Playcount:** \`${playcount}\` (\`${playhours.toFixed()} hrs\`)\n**Followers:** \`${followers}\` • **Max Combo:** \`${profile_maxcombo}\``)
			.setImage(user.cover_url)
			.setFooter({
				text: `Joined osu!${server} ${formattedDate} (${user_joined_ago} years ago)`,
			})
		return embed
	}

	await auth.login(process.env.client_id, process.env.client_secret)
	if (firstPage) {
		console.log("first page")
		try {
			global_rank = user.statistics.global_rank.toLocaleString()
			country_rank = user.statistics.country_rank.toLocaleString()
			pp = user.statistics.pp.toLocaleString()
		} catch (err) {
			global_rank = "0"
			country_rank = "0"
			pp = "0"
		}

		acc = user.statistics.hit_accuracy.toFixed(2)
		lvl = user.statistics.level.progress
		lvlprogress = lvl.toString(10).padStart(2, "0")
		playcount = user.statistics.play_count.toLocaleString()
		playhours = user.statistics.play_time.toFixed(4) / 3600
		followers = user.follower_count.toLocaleString()
		profile_maxcombo = user.statistics.maximum_combo.toLocaleString()

		//ranks
		let ssh = user.statistics.grade_counts.ssh.toLocaleString()
		let ss = user.statistics.grade_counts.ss.toLocaleString()
		let sh = user.statistics.grade_counts.sh.toLocaleString()
		let s = user.statistics.grade_counts.s.toLocaleString()
		let a = user.statistics.grade_counts.a.toLocaleString()

		//join date
		const dateString = user.join_date
		const date = new Date(dateString)
		//current time
		const currenttime = new Date()
		const timedifference = currenttime - date
		//convert the time difference to months
		const months = Math.floor(timedifference / (1000 * 60 * 60 * 24 * 30))
		const user_joined = months / 12
		const user_joined_ago = user_joined.toFixed(1)

		const formattedDate = date.toLocaleDateString("en-US", options)

		//time get
		let time
		try {
			time = `**Peak Rank:** \`#${user.rank_highest.rank.toLocaleString()}\` • **Achieved:** <t:${new Date(user.rank_highest.updated_at).getTime() / 1000}:R>\n`
		} catch (err) {
			time = ""
		}

		//embed
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
				iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
				url: `https://osu.ppy.sh/users/${user.id}/${mode}`,
			})
			.setThumbnail(user.avatar_url)
			.setDescription(`**Accuracy:** \`${acc}%\` •  **Level:** \`${user.statistics.level.current}.${lvlprogress}\`\n${time}**Playcount:** \`${playcount}\` (\`${playhours.toFixed()} hrs\`)\n**Followers:** \`${followers}\` • **Max Combo:** \`${profile_maxcombo}\`\n**Ranks:** ${grades.XH}\`${ssh}\`${grades.X}\`${ss}\`${grades.SH}\`${sh}\`${grades.S}\`${s}\`${grades.A}\`${a}\``)
			.setImage(user.cover_url)
			.setFooter({
				text: `Joined osu!${server} ${formattedDate} (${user_joined_ago} years ago)`,
			})
		return embed
	} else {
		const tops = await v2.user.scores.category(user.id, "best", {
			mode: mode,
			limit: "100",
			offset: "0",
		})

		try {
			global_rank = user.statistics.global_rank.toLocaleString()
			country_rank = user.statistics.country_rank.toLocaleString()
			pp = user.statistics.pp.toLocaleString()
			pp_spread_raw = tops[0].pp - tops[tops.length - 1].pp
			pp_spread_num = pp_spread_raw.toFixed(2)
		} catch (err) {
			global_rank = "0"
			country_rank = "0"
			pp = "0"
			pp_spread_raw = "0"
			pp_spread_num = "0"
		}

		const user_pp_statr = Math.pow(user.statistics.pp, 0.4)
		let recc_stars = (user_pp_statr * 0.195).toFixed(2)
		if (recc_stars == 0) recc_stars = 1

		replays_watched = user.statistics.replays_watched_by_others.toLocaleString()
		medal_count = user.user_achievements.length
		medal_percentage_number = (medal_count / 289) * 100
		medal_percentage = medal_percentage_number.toFixed(2)
		hpp = user.statistics.total_hits / user.statistics.play_count
		hpp_count = hpp.toFixed(1)

		//join date
		const dateString = user.join_date
		const date = new Date(dateString)
		//current time
		const currenttime = new Date()
		const timedifference = currenttime - date
		//convert the time difference to months
		const months = Math.floor(timedifference / (1000 * 60 * 60 * 24 * 30))
		const user_joined = months / 12
		const user_joined_ago = user_joined.toFixed(1)

		const formattedDate = date.toLocaleDateString("en-US", options)

		let playstyles = ""

		try {
			const first = user.playstyle[0]
			const playstyle1 = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
			playstyles += `${playstyle1} `
		} catch (err) {}

		try {
			const second = user.playstyle[1]
			const playstyle2 = second.charAt(0).toUpperCase() + second.slice(1).toLowerCase()
			playstyles += `${playstyle2} `
		} catch (err) {}

		try {
			const third = user.playstyle[2]
			const playstyle3 = third.charAt(0).toUpperCase() + third.slice(1).toLowerCase()
			playstyles += `${playstyle3} `
		} catch (err) {}

		try {
			const fourth = user.playstyle[3]
			const playstyle4 = fourth.charAt(0).toUpperCase() + fourth.slice(1).toLowerCase()
			playstyles += `${playstyle4} `
		} catch (err) {}

		if (playstyles.length === 0) {
			playstyles = "NaN"
		}

		playstyles = playstyles.trim()

		let posts = user.post_count
		if (posts == undefined) posts = "0"

		let comments = user.comments_count
		if (comments == undefined) comments = "0"

		const number_1s = user.scores_first_count

		const totalScore = user.statistics.total_score.toLocaleString()
		const rankedScore = user.statistics.ranked_score.toLocaleString()

		//embed
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
				iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
				url: `https://osu.ppy.sh/users/${user.id}/${mode}`,
			})
			.setThumbnail(user.avatar_url)
			.setDescription(`**Hits per play:** \`${hpp_count}\` • **Medals:** \`${medal_count}/289\` (\`${medal_percentage}%\`)\n**Replays watched:** \`${replays_watched}\` • **#1 Scores:** \`${number_1s}\`\n**Recommended difficulty:** \`${recc_stars}★\`\n**Total score:** \`${totalScore}\`\n**Ranked Score:** \`${rankedScore}\`\n**Plays with:** \`${playstyles}\`\n**Posts:** \`${posts}\` • **Comments:** \`${comments}\``)
			.setImage(user.cover_url)
			.setFooter({
				text: `Joined osu!${server} ${formattedDate} (${user_joined_ago} years ago)`,
			})

		return embed
	}
}

module.exports = { GetUserPage }
