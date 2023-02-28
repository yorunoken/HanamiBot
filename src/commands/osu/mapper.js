const { EmbedBuilder } = require("discord.js")
const { v2, auth } = require("osu-api-extended")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	await auth.login(process.env.client_id, process.env.client_secret)

	let string = args.join(" ").match(/"(.*?)"/)
	if (string) {
		userargs = string[1]
	} else {
		userargs = args[0]
	}
	if (userargs.length === 0) {
		message.reply("**Please provide a username.**")
		return
	}

	try {
		const maps = await v2.user.details(userargs, "osu")

		const latestranked = await v2.user.beatmaps.category(maps.id, "ranked")
		if (latestranked[0]) {
			ranked = `\n**Latest Ranked:** [${latestranked[0].artist} - ${latestranked[0].title}](https://osu.ppy.sh/beatmapsets/${latestranked[0].beatmaps[0].beatmapset_id})`
		} else {
			ranked = ""
		}

		const latestloved = await v2.user.beatmaps.category(maps.id, "loved")
		if (latestloved[0]) {
			loved = `\n**Latest Poved:** [${latestloved[0].artist} - ${latestloved[0].title}](https://osu.ppy.sh/beatmapsets/${latestloved[0].beatmaps[0].beatmapset_id})`
		} else {
			loved = ""
		}

		const latestpending = await v2.user.beatmaps.category(maps.id, "pending")
		if (latestpending[0]) {
			pending = `\n**Latest Pending:** [${latestpending[0].artist} - ${latestpending[0].title}](https://osu.ppy.sh/beatmapsets/${latestpending[0].beatmaps[0].beatmapset_id})`
		} else {
			pending = ""
		}

		const latestgraveyard = await v2.user.beatmaps.category(maps.id, "graveyard")
		if (latestgraveyard[0]) {
			graveyard = `\n**Latest Graveyard:** [${latestgraveyard[0].artist} - ${latestgraveyard[0].title}](https://osu.ppy.sh/beatmapsets/${latestgraveyard[0].beatmaps[0].beatmapset_id})`
		} else {
			graveyard = ""
		}

		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${maps.username}, Total Maps: ${maps.graveyard_beatmapset_count + maps.loved_beatmapset_count + maps.pending_beatmapset_count + maps.ranked_beatmapset_count}`,
				iconURL: `https://osuflags.omkserver.nl/${maps.country_code}-256.png`,
				url: `https://osu.ppy.sh/users/${maps.id}`,
			})
			.setDescription(`**Subscribers:** \`${maps.mapping_follower_count.toLocaleString()}\` **Kudosu:** \`${maps.kudosu.total.toLocaleString()}\`\n\n**Map Count**\n**Ranked Count:** \`${maps.ranked_beatmapset_count}\` **Loved Count:** \`${maps.loved_beatmapset_count}\`\n**Pending Count:** \`${maps.pending_beatmapset_count}\` **Graveyard Count:** \`${maps.graveyard_beatmapset_count}\`\n${ranked}${loved}${pending}${graveyard}`)

			.setThumbnail(maps.avatar_url)

		message.channel.send({ embeds: [embed] })
	} catch (err) {
		message.reply("**Invalid user.**")
	}
}
exports.name = ["mapper"]
exports.aliases = ["mapper"]
exports.description = ["Displays the mapper stats of a user\n\n**Parameters:**\n`username` get the stats from a username"]
exports.usage = [`mapper Akitoshi`]
exports.category = ["osu"]
