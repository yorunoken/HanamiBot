const {
  EmbedBuilder,
} = require("discord.js")
const fs = require("fs");
const { v2, auth, tools, mods } = require("osu-api-extended")
const { Beatmap, Calculator } = require('rosu-pp')
const { Downloader, DownloadEntry } = require("osu-downloader")


async function CompareEmbed(mapinfo, beatmapId, user, ModeString) {
  await auth.login(process.env.client_id, process.env.client_secret);
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

    let status = mapinfo.status.charAt(0).toUpperCase() + mapinfo.status.slice(1)

    one = 0
    two = 1
    three = 2
    four = 3
    five = 4

    // score set
    const scr = await v2.user.scores.beatmap.all(beatmapId, user.id, ModeString)

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
        mode: 0,
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
          mode: ModeString
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
        mode: 0,
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
        mode: 0,
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
        mode: 0,
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
        mode: 0,
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

      return { embed }

    // message.channel.send({ embeds: [embed], components: [row] })

  } catch (err) {
    console.log(err)
  }
}

module.exports = { CompareEmbed }