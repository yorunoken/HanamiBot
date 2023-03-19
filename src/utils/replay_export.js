const { v2, auth } = require("osu-api-extended")
const fs = require("fs")
const { EmbedBuilder } = require("discord.js")
const { Client } = require("ordr.js")

const cooldowns = new Map()

async function GetReplay(message, collected, user, score_id, mode) {
	try {
		// Check if the user is on cooldown
		if (cooldowns.has(user.id)) {
			const cooldownExpiration = cooldowns.get(user.id) + 60 * 1000 // 1 minute cooldown
			if (Date.now() < cooldownExpiration) {
				const remainingTime = Math.ceil((cooldownExpiration - Date.now()) / 1000)
				await message.reply(`**You must wait ${remainingTime} more seconds before rendering**`)
				return
			}
		}

		// Set the user's cooldown timestamp
		cooldowns.set(user.id, Date.now())

		//log in
		await auth.login(process.env.client_id, process.env.client_secret)

		fs.readFile("./user-data.json", async (error, data) => {
			if (error) {
				console.log(error)
				return
			}
			const userData = JSON.parse(data)
			let Idskin
			try {
				Idskin = userData[sender.id].ID_skinsender
			} catch (err) {
				Idskin = 3
			}
			if (!Idskin) {
				Idskin = 3
			}

			await message.channel.sendTyping()

			const ordrclient = new Client(process.env.ORDR_TOKEN)

			await auth.login_lazer(process.env.userd, process.env.pass)
			const download = await v2.scores.download(Number(score_id), mode, `./replayFile/${score_id}.osr`)

			const fileBuffer = fs.createReadStream(download)

			ordrclient.start()
			const sender = user

			const Replay = async () => {
				let replay
				try {
					replay = await ordrclient.newRender({
						skip: true,
						username: "yorunoken",
						breakBGDim: 60,
						introBGDim: 40,
						BGParallax: userData[sender.id].parallax,
						cursorRipples: userData[sender.id].cursor_ripples,
						cursorSize: userData[sender.id].cursor_size,
						inGameBGDim: userData[sender.id].bg_dim,
						loadStoryboard: userData[sender.id].storyboard,
						loadVideo: userData[sender.id].bg_video,
						showKeyOverlay: userData[sender.id].key_overlay,
						musicVolume: userData[sender.id].music_volume,
						hitsoundVolume: userData[sender.id].hitsound_volume,
						showDanserLogo: userData[sender.id].danser_logo,
						useSkinColors: userData[sender.id].skin_colors,
						playNightcoreSamples: userData[sender.id].nightcore_hs,
						skip: userData[sender.id].skip_intro,
						showAimErrorMeter: userData[sender.id].aim_ur,
						showUnstableRate: userData[sender.id].ur,
						showPPCounter: userData[sender.id].pp_counter,
						sliderSnakingIn: userData[sender.id].snaking_slider,
						sliderSnakingOut: userData[sender.id].snaking_slider,
						resolution: "1920x1080",
						skin: `${Idskin}`,
						replayFile: fileBuffer,
						// devmode: "success"
					})
				} catch (err) {
					message.channel.send(`${err}`)
					return
				}
				return replay
			}

			const replay = await Replay()

			let messageId
			let replay_description

			try {
				ordrclient.on("render_progress", data => {
					try {
						if (data.renderID === replay.renderID) {
							console.log(data)
							if (!messageId) {
								message.channel.send(`${data.progress}`).then(sentMessage => {
									messageId = sentMessage.id
								})
							} else {
								message.channel.messages.fetch(messageId).then(messageToEdit => {
									messageToEdit.edit(`${data.progress}`)
									if (messageToEdit.content == "Finalizing...") {
										setTimeout(() => {
											messageToEdit.delete()
										}, 2000)
									}
								})
							}
							replay_description = data.description
						}
					} catch (err) {
						message.channel.send("There was an error! Please try again.")
						return
					}
				})

				ordrclient.on("render_done", data => {
					if (data.renderID === replay.renderID) {
						const embed = new EmbedBuilder().setTitle("Replay rendering is done").setColor("Purple").setDescription(replay_description)

						message.channel.send(`<@${sender.id}> ${data.videoUrl}`)
						message.channel.send({ embeds: [embed] })
						return
					}
				})
			} catch (err) {}
		})
	} catch (err) {
		console.log(err)
	}
}

module.exports = { GetReplay }
