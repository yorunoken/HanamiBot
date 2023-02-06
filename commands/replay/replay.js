const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const { Client } = require("ordr.js")
let inProgress = false
let DoneForNow = false
let timeLeft = 5

exports.run = async (client, message, args, prefix) => {
    fs.readFile("./user-data.json", async (error, data) => {
        if (error) {
            console.log(error);
        } else {
            const userData = JSON.parse(data);
            let Idskin
            try{
                Idskin = userData[message.author.id].ID_skin
            }catch(err){
                message.reply("**No default skin set. set it using replayskin {skinID}. reverting to 1st skin**")
                Idskin = 1
            }
            console.log(Idskin)
            if (!Idskin) {
                Idskin = "3"
            }

            await message.channel.sendTyping()

            if (inProgress) {

                if (timeLeft == 0) {
                    message.channel.send(`**Please wait ${timeLeft} seconds before trying again.**`)
                    return
                }

                if (timeLeft > 1 && DoneForNow) {
                    message.channel.send("**Already rendering a replay, please try again later. See https://ordr.issou.best/renders if it's taking too long**")
                    return
                }
                message.channel.send(`**Please wait ${timeLeft} seconds before trying again.**`)
                return

            }
            inProgress = true
            DoneForNow = true

            const ordrclient = new Client(process.env.ORDR_TOKEN)



            const replayFile = message.attachments.first()?.url

            ordrclient.start()
            const sender = message.author




            console.log(Idskin)

            const Replay = async () => {
                timeLeft = 60
                let replay
                try {
                    replay = await ordrclient.newRender({
                        skip: true,
                        username: 'yorunoken',
                        breakBGDim: 60,
                        introBGDim: 40,
                        BGParallax: userData[message.author.id].parallax,
                        cursorRipples: userData[message.author.id].cursor_ripples,
                        cursorSize: userData[message.author.id].cursor_size,
                        inGameBGDim: userData[message.author.id].bg_dim,
                        loadStoryboard: userData[message.author.id].storyboard,
                        loadVideo: userData[message.author.id].bg_video,
                        showKeyOverlay: userData[message.author.id].key_overlay,
                        musicVolume: userData[message.author.id].music_volume,
                        hitsoundVolume: userData[message.author.id].hitsound_volume,
                        showDanserLogo: userData[message.author.id].danser_logo,
                        showAimErrorMeter: userData[message.author.id].aim_ur,
                        showUnstableRate: userData[message.author.id].ur,
                        showPPCounter: userData[message.author.id].pp_counter,
                        sliderSnakingIn: userData[message.author.id].snaking_slider,
                        sliderSnakingOut: userData[message.author.id].snaking_slider,
                        resolution: "1920x1080",
                        skin: `${Idskin}`,
                        replayURL: replayFile,
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
                ordrclient.on("render_progress", (data) => {
                    if (data.renderID === replay.renderID) {
                        console.log(data)
                        if (!messageId) {
                            message.channel.send(`${data.progress}`).then(sentMessage => {
                                messageId = sentMessage.id;
                            });
                        } else {
                            message.channel.messages.fetch(messageId).then(messageToEdit => {
                                messageToEdit.edit(`${data.progress}`)
                                if(messageToEdit.content == "Finalizing..."){
                                    setTimeout(() =>{
                                        messageToEdit.delete()
                                    }, 2000)
                                }
                            });
                        }
                        replay_description = data.description
                    }
                })

                ordrclient.on("render_done", (data) => {
                    if (data.renderID === replay.renderID) {
                        const embed = new EmbedBuilder()
                        .setTitle("Replay rendering is done")
                        .setColor("Purple")
                        .setDescription(replay_description)

                        message.channel.send(`<@${sender.id}> ${data.videoUrl}`)
                        message.channel.send({ embeds: [embed]})
                        DoneForNow = false
                        timeLeft = 60
                        const countdown = setInterval(() => {
                            timeLeft--
                            if (timeLeft === 0) {
                                clearInterval(countdown)
                                inProgress = false
                            }
                        }, 1000)
                        return
                    }
                })
            } catch (err) {

            }
        }

    })
















};
exports.name = ["replay"]
exports.aliases = ["replay"]
exports.description = ["Render a replay using [o!rdr](https://ordr.issou.best/). To render, send a message with a .osr file as its attachment. to change rendering options, see: \`replayskin\` and \`replaysettings\`"]
exports.usage = [`replay {.osr file as attachment}`]
exports.category = ["osu"]