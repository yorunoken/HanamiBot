// require('fetch')
const axios = require("axios")
const fs = require("fs")
const { v2, auth, mods, tools } = require("osu-api-extended")

// importing GetRecent
const { LbSend } = require("../../exports/leaderboard_export.js")
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	let AuthorsName
	fs.readFile("./user-data.json", async (error, data) => {
		if (error) return
		const userData = JSON.parse(data)
		try {
			AuthorsName = userData[message.author.id].osuUsername
		} catch (err) {
			console.log(err)
		}
	})

	await auth.login(process.env.client_id, process.env.client_secret)
	let EmbedValue = 0
	let GoodToGo = false
	let ModeSelected = false
	let GameMode

	let pagenum = 1
	if (args.includes("-p")) {
		const iIndex = args.indexOf("-p")
		pagenum = Number(args[iIndex + 1])
		value = undefined
	}

	async function GetMapMode(beatmapId) {
		const mapinfo = await v2.beatmap.diff(beatmapId)
		if (GameMode == undefined) GameMode = mapinfo.mode
		return { GameMode, mapinfo }
	}

	if (args.includes("-taiko")) {
		GameMode = "taiko"
		ModeSelected = true
	}
	if (args.includes("-mania")) {
		GameMode = "mania"
		ModeSelected = true
	}
	if (args.includes("-ctb")) {
		GameMode = "fruits"
		ModeSelected = true
	}

	let modsArg
	let SortArg = ""
	let modifiedMods = ""
	let ModText = ""
	try {
		if (args.join(" ").includes("+")) {
			const iIndex = args.indexOf("+")
			modsArg = args[iIndex + 1]
				.slice(1)
				.toUpperCase()
				.match(/[A-Z]{2}/g)
			ModText = modsArg.join("").replace(",", "")
			SortArg = `, Sorting by mod(s): \`${ModText}\``
			if (args[0].startsWith("https://")) {
				modsArg = args[iIndex + 2]
					.slice(1)
					.toUpperCase()
					.match(/[A-Z]{2}/g)
			}
			modifiedMods = modsArg.map(mod => `&mods[]=${mod}`).join("")
		} else if (isNaN(Number(args[0])) && !args[0].startsWith("https")) {
			console.log("hi")
			modsArg = args[0].toUpperCase().match(/[A-Z]{2}/g)
			if (args[0].startsWith("https://")) {
				modsArg = args[iIndex + 2]
					.slice(1)
					.toUpperCase()
					.match(/[A-Z]{2}/g)
			}
			modifiedMods = modsArg.map(mod => `&mods[]=${mod}`).join("")
			modsArg.shift()
			modsArg.shift()
			console.log(modsArg)
			ModText = modsArg.join("").replace(",", "")
			SortArg = `, Sorting by mod(s): \`${ModText}\``
		}
	} catch (err) {}

	async function SendEmbed(beatmapId, scores, pagenum, mapinfo, AuthorsName) {
		if (mapinfo.status != "ranked" && mapinfo.status != "qualified" && mapinfo.status != "loved") {
			message.channel.send("It seems like this map doesn't have a leaderboard available... Try again with another map")
			return
		}

		let ModeText
		if (mapinfo.mode_int == "0") ModeText = ", Game mode: `Standard`"
		if (mapinfo.mode_int == "1") ModeText = ", Game mode: `Taiko`"
		if (mapinfo.mode_int == "2") ModeText = ", Game mode: `Fruits`"
		if (mapinfo.mode_int == "3") ModeText = ", Game mode: `Mania`"

		message.channel.send({ content: `Global LB${SortArg}${ModeText}`, embeds: [await LbSend(beatmapId, scores, pagenum, mapinfo, AuthorsName)] })
	}

	async function EmbedFetch(embed) {
		try {
			const embed_author = embed.url
			if (embed_author.includes("/users/")) throw new Error("Wrong embed")
			if (embed_author.includes("/u/")) throw new Error("Wrong embed")
			const beatmapId = embed_author.match(/\d+/)[0]
			if (!ModeSelected) GameMode = await (await GetMapMode(beatmapId)).GameMode
			const mapinfo = await (await GetMapMode(beatmapId)).mapinfo
			if (mapinfo.id == undefined) throw new Error("Wrong embed")

			const response = await axios.get(`https://osu.ppy.sh/beatmaps/${beatmapId}/scores?mode=${GameMode}&type=global${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } })
			const scores = response.data
			//send the embed
			SendEmbed(beatmapId, scores, pagenum, mapinfo, AuthorsName)
			GoodToGo = true
		} catch (err) {
			console.log(err)

			console.log("err found, switching to author")

			try {
				const embed_author = embed.author.url
				if (embed_author.includes("/users/")) throw new Error("Wrong embed")
				if (embed_author.includes("/u/")) throw new Error("Wrong embed")
				const beatmapId = embed_author.match(/\d+/)[0]
				if (!ModeSelected) GameMode = await (await GetMapMode(beatmapId)).GameMode
				const mapinfo = await (await GetMapMode(beatmapId)).mapinfo
				if (mapinfo.id == undefined) throw new Error("Wrong embed")

				const response = await axios.get(`https://osu.ppy.sh/beatmaps/${beatmapId}/scores?mode=${GameMode}&type=global${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } })
				const scores = response.data
				//send the embed
				SendEmbed(beatmapId, scores, pagenum, mapinfo, AuthorsName)
				GoodToGo = true
			} catch (err) {
				console.log(err)

				console.log("err found, switching to desc")
				try {
					const regex = /\/b\/(\d+)/
					const match = regex.exec(embed.description)
					const beatmapId = match[1]
					if (!ModeSelected) GameMode = await (await GetMapMode(beatmapId)).GameMode
					const mapinfo = await (await GetMapMode(beatmapId)).mapinfo
					if (mapinfo.id == undefined) throw new Error("Wrong embed")

					const response = await axios.get(`https://osu.ppy.sh/beatmaps/${beatmapId}/scores?mode=${GameMode}&type=global${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } })
					const scores = response.data

					//send the embed
					SendEmbed(beatmapId, scores, pagenum, mapinfo, AuthorsName)
					GoodToGo = true
					return
				} catch (err) {
					console.log(err)
					EmbedValue++
				}
			}
		}
	}

	if (message.mentions.users.size > 0 && message.mentions.repliedUser.bot) {
		message.channel.messages.fetch(message.reference.messageId).then(message => {
			const embed = message.embeds[0]

			EmbedFetch(embed)
		})
		return
	}

	const channel = client.channels.cache.get(message.channel.id)
	channel.messages.fetch({ limit: 100 }).then(async messages => {
		//find the latest message with an embed
		let embedMessages = []
		for (const [id, message] of messages) {
			if (message.embeds.length > 0 && message.author.bot) {
				embedMessages.push(message)
			}
		}

		try {
			if (args) {
				//try to get beatmapId by link
				const regex = /\/(\d+)$/
				const match = regex.exec(args[0])
				const beatmapId = match[1]
				//if args doesn't start with https: try to get the beatmap id by number provided
				if (!args[0].startsWith("https:")) {
					beatmapId = args[0]
				}

				if (!ModeSelected) GameMode = await (await GetMapMode(beatmapId)).GameMode
				const mapinfo = await (await GetMapMode(beatmapId)).mapinfo
				if (mapinfo.id == undefined) throw new Error("Wrong embed")
				//message
				try {
					//send the embed
					const response = await axios.get(`https://osu.ppy.sh/beatmaps/${beatmapId}/scores?mode=${GameMode}&type=global${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } })
					const scores = response.data
					SendEmbed(beatmapId, scores, pagenum, mapinfo, AuthorsName)
					return
				} catch (err) {
					// console.log(err)
				}
			}
		} catch (err) {
			try {
				if (embedMessages) {
					do {
						if (!embedMessages[EmbedValue].embeds[0]) break
						const embed = embedMessages[EmbedValue].embeds[0]
						await EmbedFetch(embed)
						console.log(GoodToGo)
					} while (!GoodToGo)
				} else {
					await message.channel.send("No embeds found in the last 100 messages")
				}
			} catch (err) {
				message.channel.send("**No maps found**")
			}
		}
	})
}
exports.name = "leadearboard"
exports.aliases = ["lb", "leaderboard"]
exports.description = ["Displays the Leaderboard of a map.\n\n**Parameters:**\n`link` link a beatmap to get its leaderboard\n`+(mod combination)` get the leaderboard of that mod combination"]
exports.usage = [`lb +DTNF`]
exports.category = ["osu"]
