// require('fetch')
const axios = require('axios');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js")
const fs = require('fs')
const { v2, auth, mods, tools } = require("osu-api-extended");
const { Beatmap, Calculator } = require('rosu-pp')
const { Downloader, DownloadEntry } = require("osu-downloader")
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  await auth.login(process.env.client_id, process.env.client_secret);
  let EmbedValue = 0
  let GoodToGo = false

  let pagenum = 1
  if (args.includes('-p')) {
    const iIndex = args.indexOf('-p')
    pagenum = Number(args[iIndex + 1])
    value = undefined
  } else {
    pagenum = 1
  }

  let GameMode = "osu"
  let RuleSetId = 0

  if (args.includes('-taiko')) {
    RuleSetId = 1
    GameMode = "taiko"
  }
  if (args.includes('-mania')) {
    RuleSetId = 3
    GameMode = "mania"
  }
  if (args.includes('-ctb')) {
    RuleSetId = 2
    GameMode = "fruits"
  }

  // determine the page of the lb
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
  //grades
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


  let modsArg
  let modifiedMods
  if (args.join(" ").includes("+")) {
    const iIndex = args.indexOf("+")
    modsArg = (args[iIndex + 1].slice(1)).toUpperCase().match(/[A-Z]{2}/g)
    if (args[0].startsWith("https://")) {
      modsArg = (args[iIndex + 2].slice(1)).toUpperCase().match(/[A-Z]{2}/g)
    }
    modifiedMods = modsArg.map((mod) => `&mods[]=${mod}`).join("")
  } else {
    modifiedMods = ""
  }

  const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId("mine")
      .setLabel("Compare")
      .setStyle(ButtonStyle.Success)
  )

const disabledrow = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId("mine")
      .setLabel("Compare")
      .setStyle(ButtonStyle.Success)
      .setDisabled()
  )




  async function SendEmbed(beatmapId, scores) {
    try {

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

      const mapinfo = await v2.beatmap.diff(beatmapId)

      const totalPageRaw = scores.scores.length / 5
      const totalPage = Math.ceil(totalPageRaw)
      if (pagenum > totalPage) {
        message.reply(`**Please provide a page value not greater than **\`${totalPage}\``)
        return;
      } else {
        console.log("smaller")
      }

      if (scores.scores[one]) {

        let ModsRaw = scores.scores[one].mods.map(mod => mod.acronym).join('')
        let modsID = mods.id(ModsRaw)
        if (ModsRaw != "") {
          Mods1 = `+**${ModsRaw}**`
        } else {
          Mods1 = ""
          modsID = 0
        }

        // std
        if (scores.scores[one].statistics.great === undefined) scores.scores[one].statistics.great = 0
        if (scores.scores[one].statistics.ok === undefined) scores.scores[one].statistics.ok = 0
        if (scores.scores[one].statistics.meh === undefined) scores.scores[one].statistics.meh = 0
        if (scores.scores[one].statistics.miss === undefined) scores.scores[one].statistics.miss = 0

        // mania
        if (scores.scores[one].statistics.good === undefined) scores.scores[one].statistics.good = 0 // katu
        if (scores.scores[one].statistics.perfect === undefined) scores.scores[one].statistics.perfect = 0 // geki


        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let calc = new Calculator(scoreParam)

        // ss pp
        const maxAttrs = calc.performance(map)

        //normal pp
        let CurAttrs = calc
          .n100(scores.scores[one].statistics.ok)
          .n300(scores.scores[one].statistics.great)
          .n50(scores.scores[one].statistics.meh)
          .nMisses(Number(scores.scores[one].statistics.miss))
          .combo(scores.scores[one].max_combo)
          .nGeki(scores.scores[one].statistics.perfect)
          .nKatu(scores.scores[one].statistics.good)
          .performance(map)

        let grade = scores.scores[one].rank;
        grade = grades[grade];


        PP = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

        const date = new Date(scores.scores[one].ended_at)
        const UnixDate = date.getTime() / 1000



        first_score = `**${one + 1}.** ${grade} [**${scores.scores[one].user.username}**](https://osu.ppy.sh/users/${scores.scores[one].user.id}) (${(scores.scores[one].accuracy * 100).toFixed(2)}%) • ${scores.scores[one].total_score.toLocaleString()} **${scores.scores[one].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP} • [ **${scores.scores[one].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods1} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>\n`
      } else {
        first_score = "**No scores found.**"
      }

      if (scores.scores[two]) {

        let ModsRaw = scores.scores[two].mods.map(mod => mod.acronym).join('')
        let modsID = mods.id(ModsRaw)
        if (ModsRaw != "") {
          Mods2 = `+**${ModsRaw}**`
        } else {
          Mods2 = ""
          modsID = 0
        }

        // std
        if (scores.scores[two].statistics.great === undefined) scores.scores[two].statistics.great = 0
        if (scores.scores[two].statistics.ok === undefined) scores.scores[two].statistics.ok = 0
        if (scores.scores[two].statistics.meh === undefined) scores.scores[two].statistics.meh = 0
        if (scores.scores[two].statistics.miss === undefined) scores.scores[two].statistics.miss = 0

        // mania
        if (scores.scores[two].statistics.good === undefined) scores.scores[two].statistics.good = 0 // katu
        if (scores.scores[two].statistics.perfect === undefined) scores.scores[two].statistics.perfect = 0 // geki


        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let calc = new Calculator(scoreParam)

        // ss pp
        const maxAttrs = calc.performance(map)

        //normal pp
        let CurAttrs = calc
          .n100(scores.scores[two].statistics.ok)
          .n300(scores.scores[two].statistics.great)
          .n50(scores.scores[two].statistics.meh)
          .nMisses(Number(scores.scores[two].statistics.miss))
          .combo(scores.scores[two].max_combo)
          .nGeki(scores.scores[two].statistics.perfect)
          .nKatu(scores.scores[two].statistics.good)
          .performance(map)

        let grade2 = scores.scores[two].rank;
        grade2 = grades[grade2];


        PP2 = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

        const date = new Date(scores.scores[two].ended_at)
        const UnixDate = date.getTime() / 1000

        second_score = `**${two + 1}.** ${grade2} [**${scores.scores[two].user.username}**](https://osu.ppy.sh/users/${scores.scores[two].user.id}) (${(scores.scores[two].accuracy * 100).toFixed(2)}%) • ${scores.scores[two].total_score.toLocaleString()} **${scores.scores[two].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP2} • [ **${scores.scores[two].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods2} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>\n`

      } else {
        second_score = ""
      }

      if (scores.scores[three]) {

        let ModsRaw = scores.scores[three].mods.map(mod => mod.acronym).join('')
        let modsID = mods.id(ModsRaw)
        if (ModsRaw != "") {
          Mods3 = `+**${ModsRaw}**`
        } else {
          Mods3 = ""
          modsID = 0
        }

        // std
        if (scores.scores[three].statistics.great === undefined) scores.scores[three].statistics.great = 0
        if (scores.scores[three].statistics.ok === undefined) scores.scores[three].statistics.ok = 0
        if (scores.scores[three].statistics.meh === undefined) scores.scores[three].statistics.meh = 0
        if (scores.scores[three].statistics.miss === undefined) scores.scores[three].statistics.miss = 0

        // mania
        if (scores.scores[three].statistics.good === undefined) scores.scores[three].statistics.good = 0 // katu
        if (scores.scores[three].statistics.perfect === undefined) scores.scores[three].statistics.perfect = 0 // geki


        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let calc = new Calculator(scoreParam)

        // ss pp
        const maxAttrs = calc.performance(map)

        //normal pp
        let CurAttrs = calc
          .n100(scores.scores[three].statistics.ok)
          .n300(scores.scores[three].statistics.great)
          .n50(scores.scores[three].statistics.meh)
          .nMisses(Number(scores.scores[three].statistics.miss))
          .combo(scores.scores[three].max_combo)
          .nGeki(scores.scores[three].statistics.perfect)
          .nKatu(scores.scores[three].statistics.good)
          .performance(map)

        let grade3 = scores.scores[three].rank;
        grade3 = grades[grade3];


        PP3 = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

        const date = new Date(scores.scores[three].ended_at)
        const UnixDate = date.getTime() / 1000

        third_score = `**${three + 1}.** ${grade3} [**${scores.scores[three].user.username}**](https://osu.ppy.sh/users/${scores.scores[three].user.id}) (${(scores.scores[three].accuracy * 100).toFixed(2)}%) • ${scores.scores[three].total_score.toLocaleString()} **${scores.scores[three].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP3} • [ **${scores.scores[three].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods3} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>\n`

      } else {
        third_score = ""
      }

      if (scores.scores[four]) {

        let ModsRaw = scores.scores[four].mods.map(mod => mod.acronym).join('')
        let modsID = mods.id(ModsRaw)
        if (ModsRaw != "") {
          Mods4 = `+**${ModsRaw}**`
        } else {
          Mods4 = ""
          modsID = 0
        }

        // std
        if (scores.scores[four].statistics.great === undefined) scores.scores[four].statistics.great = 0
        if (scores.scores[four].statistics.ok === undefined) scores.scores[four].statistics.ok = 0
        if (scores.scores[four].statistics.meh === undefined) scores.scores[four].statistics.meh = 0
        if (scores.scores[four].statistics.miss === undefined) scores.scores[four].statistics.miss = 0

        // mania
        if (scores.scores[four].statistics.good === undefined) scores.scores[four].statistics.good = 0 // katu
        if (scores.scores[four].statistics.perfect === undefined) scores.scores[four].statistics.perfect = 0 // geki


        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let calc = new Calculator(scoreParam)

        // ss pp
        const maxAttrs = calc.performance(map)

        //normal pp
        let CurAttrs = calc
          .n100(scores.scores[four].statistics.ok)
          .n300(scores.scores[four].statistics.great)
          .n50(scores.scores[four].statistics.meh)
          .nMisses(Number(scores.scores[four].statistics.miss))
          .combo(scores.scores[four].max_combo)
          .nGeki(scores.scores[four].statistics.perfect)
          .nKatu(scores.scores[four].statistics.good)
          .performance(map)

        let grade4 = scores.scores[four].rank;
        grade4 = grades[grade4];


        PP4 = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

        const date = new Date(scores.scores[four].ended_at)
        const UnixDate = date.getTime() / 1000

        fourth_score = `**${four + 1}.** ${grade4} [**${scores.scores[four].user.username}**](https://osu.ppy.sh/users/${scores.scores[four].user.id}) (${(scores.scores[four].accuracy * 100).toFixed(2)}%) • ${scores.scores[four].total_score.toLocaleString()} **${scores.scores[four].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP4} • [ **${scores.scores[four].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods4} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>\n`

      } else {
        fourth_score = ""
      }

      if (scores.scores[five]) {

        let ModsRaw = scores.scores[five].mods.map(mod => mod.acronym).join('')
        let modsID = mods.id(ModsRaw)
        if (ModsRaw != "") {
          Mods5 = `+**${ModsRaw}**`
        } else {
          Mods5 = ""
          modsID = 0
        }

        // std
        if (scores.scores[five].statistics.great === undefined) scores.scores[five].statistics.great = 0
        if (scores.scores[five].statistics.ok === undefined) scores.scores[five].statistics.ok = 0
        if (scores.scores[five].statistics.meh === undefined) scores.scores[five].statistics.meh = 0
        if (scores.scores[five].statistics.miss === undefined) scores.scores[five].statistics.miss = 0

        // mania
        if (scores.scores[five].statistics.good === undefined) scores.scores[five].statistics.good = 0 // katu
        if (scores.scores[five].statistics.perfect === undefined) scores.scores[five].statistics.perfect = 0 // geki


        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let calc = new Calculator(scoreParam)

        // ss pp
        const maxAttrs = calc.performance(map)

        //normal pp
        let CurAttrs = calc
          .n100(scores.scores[five].statistics.ok)
          .n300(scores.scores[five].statistics.great)
          .n50(scores.scores[five].statistics.meh)
          .nMisses(Number(scores.scores[five].statistics.miss))
          .combo(scores.scores[five].max_combo)
          .nGeki(scores.scores[five].statistics.perfect)
          .nKatu(scores.scores[five].statistics.good)
          .performance(map)

        let grade5 = scores.scores[five].rank;
        grade5 = grades[grade5];


        PP5 = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

        const date = new Date(scores.scores[five].ended_at)
        const UnixDate = date.getTime() / 1000

        fifth_score = `**${five + 1}.** ${grade5} [**${scores.scores[five].user.username}**](https://osu.ppy.sh/users/${scores.scores[five].user.id}) (${(scores.scores[five].accuracy * 100).toFixed(2)}%) • ${scores.scores[five].total_score.toLocaleString()} **${scores.scores[five].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP5} • [ **${scores.scores[five].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods5} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>`

      } else {
        fifth_score = ""
      }

      if (modifiedMods.startsWith("&mods")) {
        modifiedMods = modsArg
        ModsSort = `**Country leaderboard, Sorting by mod(s): \`${modifiedMods}\`**`
      }
      if (modifiedMods == "") ModsSort = `**Country leaderboard**`

      const embed = new EmbedBuilder()
        .setColor("Purple")
        .setTitle(`${mapinfo.beatmapset.title} [${mapinfo.version}]`) // [${starRating.difficulty.starRating.toFixed(2)}★]
        .setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
        .setDescription(`${first_score}${second_score}${third_score}${fourth_score}${fifth_score}`)
        .setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
        .setFooter({ text: `Page: ${pagenum}/${totalPage}` })
      message.channel.send({ content: ModsSort, embeds: [embed], components: [row] })
      return;
    } catch (err) {
      console.log(err)
      message.reply("**There was an error.**")
    }
  }

  async function EmbedFetch(embed) {
    try {
      const embed_author = embed.url
      const beatmapId = embed_author.match(/\d+/)[0]

      console.log(`url ${beatmapId}`)
      const response = await axios.get(`https://osu.ppy.sh/beatmaps/${beatmapId}/scores?mode=${GameMode}&type=country${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } })
      const scores = response.data
      //send the embed
      SendEmbed(beatmapId, scores)
      GoodToGo = true


    } catch (err) {
      console.log(err)

      console.log('err found, switching to author')


      try {

        const embed_author = embed.author.url
        const beatmapId = embed_author.match(/\d+/)[0]

        console.log(`url ${beatmapId}`)
        const response = await axios.get(`https://osu.ppy.sh/beatmaps/${beatmapId}/scores?mode=${GameMode}&type=country${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } })
        const scores = response.data
        //send the embed
        SendEmbed(beatmapId, scores)
        GoodToGo = true

      } catch (err) {
        console.log(err)

        console.log('err found, switching to desc')
        try {
          const regex = /\/b\/(\d+)/;
          const match = regex.exec(embed.description);
          const beatmapId = match[1];

          console.log(`url ${beatmapId}`)
          const response = await axios.get(`https://osu.ppy.sh/beatmaps/${beatmapId}/scores?mode=${GameMode}&type=country${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } })
          const scores = response.data
          //send the embed
          SendEmbed(beatmapId, scores)
          GoodToGo = true

          return;

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
    return;

  }



  const channel = client.channels.cache.get(message.channel.id);
  channel.messages.fetch({ limit: 100 }).then(async messages => {



    //find the latest message with an embed
    let embedMessages = [];
    for (const [id, message] of messages) {
      if (message.embeds.length > 0 && message.author.bot) {
        embedMessages.push(message);
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
        const map = await v2.beatmap.diff(beatmapId)
        map.id

        //message
        try {
          //send the embed
          const response = await axios.get(`https://osu.ppy.sh/beatmaps/${beatmapId}/scores?mode=${GameMode}&type=country${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } })
          const scores = response.data
          SendEmbed(beatmapId, scores)
          return;
        } catch (err) {
          // console.log(err)
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

  fs.readFile("./user-data.json", async (error, data) => {
    if (error) {
      console.log(error);
      return;
    }
    const userData = JSON.parse(data);

    async function SendEmbed(mapinfo, beatmapId, user) {
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


        one = 0;
        two = 1;
        three = 2;
        four = 3;
        five = 4;

        if (mapinfo.status == "unranked" || mapinfo.status == "graveyard") {
          message.channel.send("**Unranked map, cannot parse scores**")
          return
        }

        let status = mapinfo.status.charAt(0).toUpperCase() + mapinfo.status.slice(1)

        // score set
        const scr = await v2.user.scores.beatmap.all(beatmapId, user.id, "osu")

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
              url: `https://osu.ppy.sh/users/${user.id}`,
            })
            .setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}] [${maxAttrs.difficulty.stars.toFixed(2)}★]`)
            .setDescription("**No scores found**")
            .setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
            .setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
            .setThumbnail(user.avatar_url)
            .setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` })

          message.channel.send({ embeds: [embed], components: [row] })
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
            url: `https://osu.ppy.sh/users/${user.id}`,
          })
          .setTitle(`${mapinfo.beatmapset.artist} - ${mapinfo.beatmapset.title} [${mapinfo.version}]`)
          .setDescription(`${thing1}${thing2}${thing3}${thing4}${thing5}${pageCount}`)
          .setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
          .setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
          .setThumbnail(user.avatar_url)
          .setFooter({ text: `${status} map by ${mapinfo.beatmapset.creator}`, iconURL: `https://a.ppy.sh/${mapinfo.beatmapset.user_id}?1668890819.jpeg` })

        message.channel.send({ embeds: [embed], components: [row] })
        return;
      } catch (err) {
        console.log(err)
      }
    }



    const collector = message.channel.createMessageComponentCollector()
  
  
    try {
      collector.on("collect", async (i) => {
        try {
          if (i.customId == "mine") {
            await i.update({ embeds: [i.message.embeds[0]], components: [disabledrow] })
            console.log("hi")
            const userargs = userData[i.user.id].osuUsername
            if (userargs == undefined) {
              message.channel.send(`<@${i.user.id}> Please set your osu! username by typing **${prefix}link "your username"**`);
              return
            }
  
            const user = await v2.user.details(userargs, "osu")
            const beatmapId = i.message.embeds[0].url.match(/\d+/)[0]
            const mapinfo = await v2.beatmap.diff(beatmapId)
  
            await SendEmbed(mapinfo, beatmapId, user)
            return;
  
          }
  
        } catch (err) {
          console.log(err)
        }
      })
    } catch (err) { }



  })




};
exports.name = "countrylb";
exports.aliases = ["countrylb", "ct", "clb", "cleaderboard", "countrytop", "countryt"]
exports.description = ["Displays the Country (Turkey only) leaderboard of a map.\n\n**Parameters:**\n\`link\` link a beatmap to get its leaderboard\n\`+(mod combination)\` get the leaderboard of that mod combination"]
exports.usage = [`ct https://osu.ppy.sh/b/2039543 +nf`]
exports.category = ["osu"]