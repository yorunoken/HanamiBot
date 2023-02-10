const { EmbedBuilder } = require("discord.js")
const fs = require("fs");
const { v2, auth, tools, mods } = require("osu-api-extended");
const { Beatmap, Calculator } = require('rosu-pp')
const { Downloader, DownloadEntry } = require("osu-downloader")

exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  fs.readFile("./user-data.json", async (error, data) => {
    if (error) {
      console.log(error);
    } else {
      const userData = JSON.parse(data);
      let userargs
      let value = undefined
      let pagenum = 1
      let ModeOsu = "osu"
      let ErrCount = 0
      let RuleSetId = 0

      let EmbedValue = 0
      let GoodToGo = false


      if (args.includes('-i')) {
        const iIndex = args.indexOf('-i');
        value = Number(args[iIndex + 1] - 1)
        pagenum = undefined
      } else {
        value = undefined
      }

      if (args.includes('-p')) {
        const iIndex = args.indexOf('-p')
        pagenum = Number(args[iIndex + 1])
        value = undefined
      } else {
        pagenum = 1
      }

      let string = args.join(" ").match(/"(.*?)"/)
      if (string) {
        userargs = string[1]
      } else {
        userargs = args[0]
      }



      if (message.mentions.users.size > 0) {
        const mentionedUser = message.mentions.users.first();
        try {
          if (message.content.includes(`<@${mentionedUser.id}>`)) {
            userargs = userData[mentionedUser.id].osuUsername;
          }

        } catch (err) {
          console.error(err);
          if (mentionedUser) {
            if (message.content.includes(`<@${mentionedUser.id}>`)) {
              try {
                userData[mentionedUser.id].osuUsername;
              } catch (err) {
                message.reply(`No osu! user found for ${mentionedUser.tag}`);
              }
            } else {
              try {
                userData[message.author.id].osuUsername;
              } catch (err) {
                message.reply(
                  `Set your osu! username by using "${prefix}osuset **your username**"`
                );
              }
            }
          }
          return;
        }
      } else {
        if (args[0] === undefined) {
          try {
            userargs = userData[message.author.id].osuUsername;
          } catch (err) {
            console.error(err);
            message.reply(
              `Set your osu! username by using "${prefix}osuset **your username**"`
            );
            return;
          }
        } else {



          try {

            if (args.includes("-mania")) {
              RuleSetId = 3
              ModeOsu = "mania"
            }
            if (args.join(" ").startsWith("-mania")) userargs = userData[message.author.id].osuUsername


            if (args.includes("-taiko")) {
              RuleSetId = 1
              ModeOsu = "taiko"
            }
            if (args.join(" ").startsWith("-taiko")) userargs = userData[message.author.id].osuUsername

            if (args.includes("-ctb")) {
              RuleSetId = 2
              ModeOsu = "ctb"
            }
            if (args.join(" ").startsWith("-ctb")) userargs = userData[message.author.id].osuUsername

            if (args.join(" ").startsWith("-i") || args.join(" ").startsWith("-p")) {
              userargs = userData[message.author.id].osuUsername
            }

          } catch (err) {
            message.reply(`Set your osu! username by using "${prefix}osuset **your username**"`);
          }

        }
      }


      try {
        if (message.content.includes(`<@`)) {
          userargs = userData[mentionedUser.id].osuUsername;
        }

      } catch (err) {

      }

      console.log(userargs)

      if (userargs?.length === 0 || userargs === undefined) {
        userargs = userData[message.author.id].osuUsername;
      }

      console.log(value, pagenum, userargs)

      //log into api
      await auth.login(process.env.client_id, process.env.client_secret);
      let user = await v2.user.details(userargs, ModeOsu)

      if (user.id == undefined) {
        message.reply(`**The user ${userargs} doesn't exist.**`)
        return;
      }


      const channel = client.channels.cache.get(message.channel.id);

      channel.messages.fetch({ limit: 100 }).then(async messages => {
        // determine the page of the compare
        const start = (pagenum - 1) * 5 + 1;
        const end = pagenum * 5;
        const numbers = [];
        for (let i = start; i <= end; i++) {
          numbers.push(i);
        }
        one = numbers[0] - 1;
        two = numbers[1] - 1;
        three = numbers[2] - 1;
        four = numbers[3] - 1;
        five = numbers[4] - 1;


        //find the latest message with an embed
        let embedMessages = [];
        for (const [id, message] of messages) {
          if (message.embeds.length > 0 && message.author.bot) {
            embedMessages.push(message);
          }
        }




        let SendEmbed
        if (value >= 0) {
          console.log('value')


          SendEmbed = async function (mapinfo, beatmapId, user) {
            try {
              if (mapinfo.status == "unranked" || mapinfo.status == "graveyard") {
                message.channel.send("**Unranked map, cannot parse scores**")
                return
              }

              if (!fs.existsSync(`./osuFiles/${beatmapId}.osu`)) {
                console.log("no file.")
                const downloader = new Downloader({
                  rootPath: './osuFiles',

                  filesPerSecond: 0,
                });

                downloader.addSingleEntry(beatmapId)
                await downloader.downloadSingle()
              }

              try {
                // formatted values for user
                global_rank = user.statistics.global_rank.toLocaleString();
                country_rank = user.statistics.country_rank.toLocaleString();
                user_pp = user.statistics.pp.toLocaleString();
              } catch (err) {
                global_rank = 0
                country_rank = 0
                user_pp = 0
              }

              //rosu pp setup
              const downloader = new Downloader({
                rootPath: './osuFiles',

                filesPerSecond: 5,
              });

              downloader.addSingleEntry(beatmapId);
              await downloader.downloadSingle()



              let scoreParam = {
                mode: RuleSetId,
                mods: 0,
              }

              let map = new Beatmap({ path: `./osuFiles/${beatmapId}.osu` })
              let calc = new Calculator(scoreParam)


              // ss pp
              let maxAttrs = calc.performance(map)

              let status = mapinfo.status.charAt(0).toUpperCase() + mapinfo.status.slice(1)


              // score set
              const scr = await v2.user.scores.beatmap.all(beatmapId, user.id, ModeOsu)

              let score
              try {
                score = scr.scores.sort((a, b) => b.pp - a.pp)[value]
                if (score == undefined) throw new Error("No score")
              } catch (err) {

                const embed = new EmbedBuilder()
                  .setColor('Purple')
                  .setAuthor({
                    name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
                    iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
                    url: `https://osu.ppy.sh/u/${user.id}`,
                  })
                  .setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}] [${maxAttrs.difficulty.stars.toFixed(2)}★]`)
                  .setDescription("**No scores found**")
                  .setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
                  .setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
                  .setThumbnail(user.avatar_url)
                  .setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` })

                message.channel.send({ embeds: [embed] })
                return;
              }

              let objects1 = mapinfo.count_circles + mapinfo.count_sliders + mapinfo.count_spinners


              let modsone = score.mods.join("")
              if (!modsone.length) {
                modsone = "NM";
                modsID = 0
              } else {
                modsID = mods.id(modsone)
              }


              scoreParam = {
                mode: RuleSetId,
                mods: modsID,
              }

              calc = new Calculator(scoreParam)

              // ss pp
              maxAttrs = calc.performance(map)

              //normal pp
              let CurAttrs = calc
                .n100(score.statistics.count_100)
                .n300(score.statistics.count_300)
                .n50(score.statistics.count_50)
                .nMisses(Number(score.statistics.count_miss))
                .combo(score.max_combo)
                .nGeki(score.statistics.count_geki)
                .nKatu(score.statistics.count_katu)
                .performance(map)

              //fc pp
              let FCAttrs = calc
                .n100(score.statistics.count_100)
                .n300(score.statistics.count_300)
                .n50(score.statistics.count_50)
                .nMisses(0)
                .combo(maxAttrs.difficulty.maxCombo)
                .nGeki(score.statistics.count_geki)
                .nKatu(score.statistics.count_katu)
                .performance(map)



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

              // score set at   
              time1 = new Date(score.created_at).getTime() / 1000


              pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`
              if (CurAttrs.effectiveMissCount > 0) {
                Map300CountFc = objects1 - score.statistics.count_100 - score.statistics.count_50

                const FcAcc = tools.accuracy({
                  "300": Map300CountFc,
                  "geki": score.statistics.count_geki,
                  "100": score.statistics.count_100,
                  "katu": score.statistics.count_katu,
                  "50": score.statistics.count_50,
                  "0": 0,
                  mode: "osu"
                })

                pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP ▹ (**${FCAttrs.pp.toFixed(2)}**PP for **${FcAcc}%**)`
              }

              let grade = score.rank;
              grade = grades[grade];

              thing = `**${value + 1}.**${grade} **+${modsone}** **∙** ${score.score.toLocaleString()} **∙** **(${(score.accuracy * 100).toFixed(2)
                }%)**\n${pps} **∙** [**${score.max_combo}**x/${maxAttrs.difficulty.maxCombo}x] **∙** {**${score.statistics.count_300}**/${score.statistics.count_100}/${score.statistics.count_50}/${score.statistics.count_miss
                }}\nScore Set <t:${time1}:R>`

              //embed
              const embed = new EmbedBuilder()
                .setColor('Purple')
                .setAuthor({
                  name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
                  iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
                  url: `https://osu.ppy.sh/u/${user.id}`,
                })
                .setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}] [${maxAttrs.difficulty.stars.toFixed(2)}★]`)
                .setDescription(thing)
                .setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
                .setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
                .setThumbnail(user.avatar_url)
                .setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` })

              message.channel.send({ embeds: [embed] })

              return;
            } catch (err) {
              ErrCount++
              console.log(err)
            }

          }


        } else {
          console.log('not defined')
          SendEmbed = async function (mapinfo, beatmapId, user) {
            try {

              try {
                // formatted values for user
                global_rank = user.statistics.global_rank.toLocaleString();
                country_rank = user.statistics.country_rank.toLocaleString();
                user_pp = user.statistics.pp.toLocaleString();
              } catch (err) {
                global_rank = 0
                country_rank = 0
                user_pp = 0
              }

              if (mapinfo.status == "unranked" || mapinfo.status == "graveyard") {
                message.channel.send("**Unranked map, cannot parse scores**")
                return
              }

              let status = mapinfo.status.charAt(0).toUpperCase() + mapinfo.status.slice(1)

              // score set
              const scr = await v2.user.scores.beatmap.all(beatmapId, user.id, ModeOsu)

              let score
              try {
                score = scr.scores.sort((a, b) => b.pp - a.pp)
                if (score == undefined) throw new Error("unranked")
              } catch (err) {
                const embed = new EmbedBuilder()
                  .setColor('Purple')
                  .setAuthor({
                    name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
                    iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
                    url: `https://osu.ppy.sh/u/${user.id}`,
                  })
                  .setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}] [${maxAttrs.difficulty.stars.toFixed(2)}★]`)
                  .setDescription("**No scores found**")
                  .setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
                  .setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
                  .setThumbnail(user.avatar_url)
                  .setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` })

                message.channel.send({ embeds: [embed] })
              }

              if (!fs.existsSync(`./osuFiles/${beatmapId}.osu`)) {
                console.log("no file.")
                const downloader = new Downloader({
                  rootPath: './osuFiles',

                  filesPerSecond: 0,
                });

                downloader.addSingleEntry(beatmapId)
                await downloader.downloadSingle()
              }
              let map = new Beatmap({ path: `./osuFiles/${beatmapId}.osu` })
              let objects1 = mapinfo.count_circles + mapinfo.count_sliders + mapinfo.count_spinners

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



              let thing1 = "**No scores**"
              let thing2 = ""
              let thing3 = ""
              let thing4 = ""
              let thing5 = ""

              const pagenumraw = score.length / 5
              const pagenum = Math.ceil(pagenumraw)

              let pageCount = ``


              if (score[one]) {
                pageCount = `**Page:** \`${one + 1}/${pagenum}\``

                let modsone = score[one].mods.join("")
                let modsID
                if (!modsone.length) {
                  modsone = "NM";
                  modsID = 0
                } else {
                  modsID = mods.id(modsone)
                }

                let scoreParam = {
                  mode: RuleSetId,
                }

                let calc = new Calculator(scoreParam)


                // ss pp
                let maxAttrs1 = calc.mods(modsID).performance(map)

                //normal pp
                let CurAttrs1 = calc
                  .n100(score[one].statistics.count_100)
                  .n300(score[one].statistics.count_300)
                  .n50(score[one].statistics.count_50)
                  .nMisses(Number(score[one].statistics.count_miss))
                  .combo(score[one].max_combo)
                  .nGeki(score[one].statistics.count_geki)
                  .nKatu(score[one].statistics.count_katu)
                  .mods(modsID)
                  .performance(map)

                //fc pp
                let FCAttrs1 = calc
                  .n100(score[one].statistics.count_100)
                  .n300(score[one].statistics.count_300)
                  .n50(score[one].statistics.count_50)
                  .nMisses(0)
                  .combo(maxAttrs1.difficulty.maxCombo)
                  .nGeki(score[one].statistics.count_geki)
                  .nKatu(score[one].statistics.count_katu)
                  .performance(map)

                // score set at   
                time1 = new Date(score[one].created_at).getTime() / 1000

                pps = `**${CurAttrs1.pp.toFixed(2)}**/${maxAttrs1.pp.toFixed(2)}PP`
                if (CurAttrs1.effectiveMissCount > 0) {
                  Map300CountFc = objects1 - score[one].statistics.count_100 - score[one].statistics.count_50

                  const FcAcc = tools.accuracy({
                    "300": Map300CountFc,
                    "geki": score[one].statistics.count_geki,
                    "100": score[one].statistics.count_100,
                    "katu": score[one].statistics.count_katu,
                    "50": score[one].statistics.count_50,
                    "0": 0,
                    mode: "osu"
                  })
                  pps = `**${CurAttrs1.pp.toFixed(2)}**/${maxAttrs1.pp.toFixed(2)}PP ▹ (**${FCAttrs1.pp.toFixed(2)}**PP for **${FcAcc}%**)`
                }

                let grade = score[one].rank;
                grade = grades[grade];

                thing1 = `**__Top score:__\n${one + 1}.**${grade} **+${modsone}** [${maxAttrs1.difficulty.stars.toFixed(2)}★] **∙** ${score[one].score.toLocaleString()} **∙** **(${(score[one].accuracy * 100).toFixed(2)
                  }%)**\n▹${pps}\n▹[**${score[one].max_combo}**x/${FCAttrs1.difficulty.maxCombo}x] **∙** {**${score[one].statistics.count_300}**/${score[one].statistics.count_100}/${score[one].statistics.count_50}/${score[one].statistics.count_miss
                  }}\nScore Set <t:${time1}:R>\n`

              }

              if (score[two]) {

                let modstwo = score[two].mods.join("")
                if (!modstwo.length) {
                  modstwo = "NM";
                  modsID2 = 0
                } else {
                  modsID2 = mods.id(modstwo)
                }
                let scoreParam = {
                  mode: RuleSetId,
                }
                let calc = new Calculator(scoreParam)


                // ss pp
                let maxAttrs2 = calc.mods(modsID2).performance(map)

                //normal pp
                let CurAttrs2 = calc
                  .n100(score[two].statistics.count_100)
                  .n300(score[two].statistics.count_300)
                  .n50(score[two].statistics.count_50)
                  .nMisses(Number(score[two].statistics.count_miss))
                  .combo(score[two].max_combo)
                  .nGeki(score[two].statistics.count_geki)
                  .nKatu(score[two].statistics.count_katu)
                  .mods(modsID2)
                  .performance(map)

                //fc pp
                let FCAttrs2 = calc
                  .n100(score[two].statistics.count_100)
                  .n300(score[two].statistics.count_300)
                  .n50(score[two].statistics.count_50)
                  .nMisses(0)
                  .combo(maxAttrs2.difficulty.maxCombo)
                  .nGeki(score[two].statistics.count_geki)
                  .nKatu(score[two].statistics.count_katu)
                  .mods(modsID2)
                  .performance(map)


                time2 = new Date(score[two].created_at).getTime() / 1000


                let grade2 = score[two].rank;
                grade2 = grades[grade2];


                thing2 = `**__Other scores:__\n${two + 1}.**${grade2} **+${modstwo}** [${maxAttrs2.difficulty.stars.toFixed(2)}★] **∙** **(${(score[two].accuracy * 100).toFixed(2)
                  }%)** **${score[two].statistics.count_miss}**<:hit00:1061254490075955231>\n▹**${CurAttrs2.pp.toFixed(2)}**/${FCAttrs2.pp.toFixed(2)}PP **∙** [**${score[two].max_combo}**x/${FCAttrs2.difficulty.maxCombo}x] <t:${time2}:R>\n`
              }

              if (score[three]) {

                let modstwo = score[three].mods.join("")
                if (!modstwo.length) {
                  modstwo = "NM";
                  modsID2 = 0
                } else {
                  modsID2 = mods.id(modstwo)
                }
                let scoreParam = {
                  mode: RuleSetId,
                }
                let calc = new Calculator(scoreParam)


                // ss pp
                let maxAttrs2 = calc.mods(modsID2).performance(map)

                //normal pp
                let CurAttrs2 = calc
                  .n100(score[three].statistics.count_100)
                  .n300(score[three].statistics.count_300)
                  .n50(score[three].statistics.count_50)
                  .nMisses(Number(score[three].statistics.count_miss))
                  .combo(score[three].max_combo)
                  .nGeki(score[three].statistics.count_geki)
                  .nKatu(score[three].statistics.count_katu)
                  .mods(modsID2)
                  .performance(map)

                //fc pp
                let FCAttrs2 = calc
                  .n100(score[three].statistics.count_100)
                  .n300(score[three].statistics.count_300)
                  .n50(score[three].statistics.count_50)
                  .nMisses(0)
                  .combo(maxAttrs2.difficulty.maxCombo)
                  .nGeki(score[three].statistics.count_geki)
                  .nKatu(score[three].statistics.count_katu)
                  .mods(modsID2)
                  .performance(map)


                time2 = new Date(score[three].created_at).getTime() / 1000


                let grade2 = score[three].rank;
                grade2 = grades[grade2];


                thing3 = `**${three + 1}.**${grade2} **+${modstwo}** [${maxAttrs2.difficulty.stars.toFixed(2)}★] **∙** **(${(score[three].accuracy * 100).toFixed(2)
                  }%)** **${score[three].statistics.count_miss}**<:hit00:1061254490075955231>\n▹**${CurAttrs2.pp.toFixed(2)}**/${FCAttrs2.pp.toFixed(2)}PP **∙** [**${score[three].max_combo}**x/${FCAttrs2.difficulty.maxCombo}x] <t:${time2}:R>\n`
              }

              if (score[four]) {

                let modstwo = score[four].mods.join("")
                if (!modstwo.length) {
                  modstwo = "NM";
                  modsID2 = 0
                } else {
                  modsID2 = mods.id(modstwo)
                }
                let scoreParam = {
                  mode: RuleSetId,
                }
                let calc = new Calculator(scoreParam)


                // ss pp
                let maxAttrs2 = calc.mods(modsID2).performance(map)

                //normal pp
                let CurAttrs2 = calc
                  .n100(score[four].statistics.count_100)
                  .n300(score[four].statistics.count_300)
                  .n50(score[four].statistics.count_50)
                  .nMisses(Number(score[four].statistics.count_miss))
                  .combo(score[four].max_combo)
                  .nGeki(score[four].statistics.count_geki)
                  .nKatu(score[four].statistics.count_katu)
                  .mods(modsID2)
                  .performance(map)

                //fc pp
                let FCAttrs2 = calc
                  .n100(score[four].statistics.count_100)
                  .n300(score[four].statistics.count_300)
                  .n50(score[four].statistics.count_50)
                  .nMisses(0)
                  .combo(maxAttrs2.difficulty.maxCombo)
                  .nGeki(score[four].statistics.count_geki)
                  .nKatu(score[four].statistics.count_katu)
                  .mods(modsID2)
                  .performance(map)


                time2 = new Date(score[four].created_at).getTime() / 1000


                let grade2 = score[four].rank;
                grade2 = grades[grade2];


                thing4 = `**${four + 1}.**${grade2} **+${modstwo}** [${maxAttrs2.difficulty.stars.toFixed(2)}★] **∙** **(${(score[four].accuracy * 100).toFixed(2)
                  }%)** **${score[four].statistics.count_miss}**<:hit00:1061254490075955231>\n▹**${CurAttrs2.pp.toFixed(2)}**/${FCAttrs2.pp.toFixed(2)}PP **∙** [**${score[four].max_combo}**x/${FCAttrs2.difficulty.maxCombo}x] <t:${time2}:R>\n`
              }

              if (score[five]) {

                let modstwo = score[five].mods.join("")
                if (!modstwo.length) {
                  modstwo = "NM";
                  modsID2 = 0
                } else {
                  modsID2 = mods.id(modstwo)
                }
                let scoreParam = {
                  mode: RuleSetId,
                }
                let calc = new Calculator(scoreParam)


                // ss pp
                let maxAttrs2 = calc.mods(modsID2).performance(map)

                //normal pp
                let CurAttrs2 = calc
                  .n100(score[five].statistics.count_100)
                  .n300(score[five].statistics.count_300)
                  .n50(score[five].statistics.count_50)
                  .nMisses(Number(score[five].statistics.count_miss))
                  .combo(score[five].max_combo)
                  .nGeki(score[five].statistics.count_geki)
                  .nKatu(score[five].statistics.count_katu)
                  .mods(modsID2)
                  .performance(map)

                //fc pp
                let FCAttrs2 = calc
                  .n100(score[five].statistics.count_100)
                  .n300(score[five].statistics.count_300)
                  .n50(score[five].statistics.count_50)
                  .nMisses(0)
                  .combo(maxAttrs2.difficulty.maxCombo)
                  .nGeki(score[five].statistics.count_geki)
                  .nKatu(score[five].statistics.count_katu)
                  .mods(modsID2)
                  .performance(map)


                time2 = new Date(score[five].created_at).getTime() / 1000


                let grade2 = score[five].rank;
                grade2 = grades[grade2];


                thing5 = `**${five + 1}.**${grade2} **+${modstwo}** [${maxAttrs2.difficulty.stars.toFixed(2)}★] **∙** **(${(score[five].accuracy * 100).toFixed(2)
                  }%)** **${score[five].statistics.count_miss}**<:hit00:1061254490075955231>\n▹**${CurAttrs2.pp.toFixed(2)}**/${FCAttrs2.pp.toFixed(2)}PP **∙** [**${score[five].max_combo}**x/${FCAttrs2.difficulty.maxCombo}x] <t:${time2}:R>\n`
              }




              //embed
              const embed = new EmbedBuilder()
                .setColor('Purple')
                .setAuthor({
                  name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
                  iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
                  url: `https://osu.ppy.sh/u/${user.id}`,
                })
                .setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}]`)
                .setDescription(`${thing1}${thing2}${thing3}${thing4}${thing5}${pageCount}`)
                .setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
                .setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
                .setThumbnail(user.avatar_url)
                .setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` })

              message.channel.send({ embeds: [embed] })
              return;
            } catch (err) {
              ErrCount++
              console.log(err)
            }
          }
        }


        async function EmbedFetch(embed) {
          try {
            const embed_author = embed.url
            const beatmapId = embed_author.match(/\d+/)[0]
            console.log(beatmapId)

            const mapinfo = await v2.beatmap.diff(beatmapId)

            if (mapinfo.id == undefined) throw new Error("No Author")
            //send the embed
            await SendEmbed(mapinfo, beatmapId, user)
            GoodToGo = true


          } catch (err) {
            console.log(err)

            console.log('err found, switching to author')


            try {

              const embed_author = embed.author.url
              const beatmapId = embed_author.match(/\d+/)[0]

              const mapinfo = await v2.beatmap.diff(beatmapId)

              if (mapinfo.id == undefined) throw new Error("No Author")

              //send the embed
              await SendEmbed(mapinfo, beatmapId, user)
              GoodToGo = true

            } catch (err) {
              console.log(err)

              console.log('err found, switching to desc')
              try {
                const regex = /\/b\/(\d+)/;
                const match = regex.exec(embed.description);
                const beatmapId = match[1];



                const mapinfo = await v2.beatmap.diff(beatmapId)

                if (mapinfo.id == undefined) throw new Error("No Author")
                //send the embed
                await SendEmbed(mapinfo, beatmapId, user)
                GoodToGo = true
                return;

              } catch (err) {
                EmbedValue++
                ErrCount++
              }



            }




          }

        }



        if (message.mentions.users.size > 0 && message.mentions.repliedUser?.bot) {
          message.channel.messages.fetch(message.reference.messageId).then(message => {
            const embed = message.embeds[0]

            EmbedFetch(embed)
          })
          return;
        }


        // embed
        try {
          if (args) {
            console.log('url')
            // try to get beatmapId by link
            const regex = /\/(\d+)$/
            const match = regex.exec(args[0])
            const beatmapId = match[1];
            // if args doesn't start with https: try to get the beatmap id by number provided
            if (!args[0].startsWith("https:")) {
              beatmapId = args[0]
            }

            if (userargs.startsWith("https")) {
              console.log('startswith')
              userargs = userData[message.author.id].osuUsername

              if (args[1]) {
                userargs = args[1]
                if (string) {
                  userargs = string[1]
                }
              }
            }

            // message
            try {
              // user set

              user = await v2.user.details(userargs, ModeOsu)

              const mapinfo = await v2.beatmap.diff(beatmapId)

              // send the embed
              await SendEmbed(mapinfo, beatmapId, user)

              if (ErrCount >= 1) {
                message.reply(`**No Scores Found For \`${user.username}\`.**`)
                return;
              }

            } catch (err) {
              console.log(err)
            }
          }
        } catch (err) {

          try {
            if (embedMessages) {
              do {
                if (!embedMessages[EmbedValue].embeds[0]) break;
                const embed = embedMessages[EmbedValue].embeds[0];
                await EmbedFetch(embed)
                console.log(GoodToGo)
              }
              while (!GoodToGo)

            } else {
              await message.channel.send('No embeds found in the last 100 messages');
            }
          } catch (err) {
            message.channel.send("**No maps found**")
          }
        }



      });
    }
  })

};
exports.name = "compare"
exports.aliases = ["compare", "c"]
exports.description = ["Displays your best scores of a beatmap.\n\n**Parameters:**\n\`username\` get the score of a user (must be first parameter)\n\`link\` get score by beatmap link \n\`-i (int)\` get a specific score.\n\`-p (int)\` get a specific page"]
exports.usage = [`compare https://osu.ppy.sh/b/1861487 whitecat`]
exports.category = ["osu"]
