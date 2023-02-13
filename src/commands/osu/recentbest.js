const { EmbedBuilder } = require("discord.js")
const fs = require("fs");
const { v2, auth, tools, mods } = require("osu-api-extended")
const { Beatmap, Calculator } = require('rosu-pp')
const { Downloader, DownloadEntry } = require("osu-downloader")
module.exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  fs.readFile("./user-data.json", async (error, data) => {
    if (error) {
      console.log(error);
      return;
    }
    const userData = JSON.parse(data);
    let userargs
    let value = 0
    play_number = undefined
    let mode
    try{
      mode = userData[message.author.id].osumode
      if (mode == undefined) mode = "osu"
    }catch(err){
      mode = "osu"
    }
    let RuleSetId = 0
    let string

    if (message.mentions.users.size > 0) {
      const mentionedUser = message.mentions.users.first();
      try {
        if (mentionedUser) {
          if (message.content.includes(`<@${mentionedUser.id}>`)) {
            userargs = userData[mentionedUser.id].osuUsername;
          } else {
            userargs = userData[message.author.id].osuUsername;
          }
        }
      } catch (err) {
        console.error(err);
        if (mentionedUser) {
          if (message.content.includes(`<@${mentionedUser.id}>`)) {
            try {
              userargs = userData[mentionedUser.id].osuUsername;
            } catch (err) {
              message.reply(`No osu! user found for ${mentionedUser.tag}`);
            }
          } else {
            try {
              userargs = userData[message.author.id].osuUsername;
            } catch (err) {
              message.reply(
                `Set your osu! username by using "${prefix}link **your username**"`
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
            `Set your osu! username by using "${prefix}link **your username**"`
          );
          return;
        }
      } else {
        string = args.join(" ").match(/"(.*?)"/)
        if (string) {
          userargs = string[1]
        } else {
          userargs = args[0]
        }

        if (args.includes("-osu")) {
          mode = "osu"
          RuleSetId = 0
        }

        if (args.includes("-mania")) {
          mode = "mania"
          RuleSetId = 3
        }
        if (args.includes("-taiko")) {
          mode = "taiko"
          RuleSetId = 1
        }
        if (args.includes("-ctb")) {
          mode = "fruits"
          RuleSetId = 2
        }

      }
    }

    let argValues = {};
    for (const arg of args) {
      const [key, value] = arg.split("=");
      argValues[key] = value;
    }

    try {
      if (args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-taiko") || args.join(" ").startsWith("-rev") || args.join(" ").startsWith("-l") || args.join(" ").startsWith("-list") || args.join(" ").startsWith("-i") || args.join(" ").startsWith("+") || args.join(" ").startsWith("mods")) {
        userargs = userData[message.author.id].osuUsername
      }
    } catch (err) {
      message.reply(`Set your osu! username by using "${prefix}link **your username**"`);
    }

    try {
      if (userargs.length === 0) {
        userargs = userData[message.author.id].osuUsername;
      }
    } catch (err) {
      message.reply(`Set your osu! username by using "${prefix}link **your username**"`);
    }


    //log in
    await auth.login(process.env.client_id, process.env.client_secret);
    const user = await v2.user.details(userargs, mode)

    try {
      if (user.id == undefined) throw new Error("The user doesn't exist")
    } catch (err) {
      message.reply(`**The user \`${userargs}\` doesn't exist**`)
      return;
    }

    if (args.join(" ").includes("+")) {
      const iIndex = args.indexOf("+")
      modsArg = (args[iIndex + 1].slice(1)).toUpperCase().match(/[A-Z]{2}/g)
      argValues['mods'] = modsArg.join("")
    }



    let filteredscore
    let FilterMods = ""
    sortmod = 0



    if (args.includes("-l") || args.includes("-list")) {
      if (args.includes('-p')) {
        singleArgument = args.slice(0, args.indexOf('-p')).join(' ')
        const iIndex = args.indexOf('-p');
        value = args[iIndex + 1];
        userargs = singleArgument
      } else {
        singleArgument = args.join(' ');
        value = 1
        userargs = singleArgument
      }


      if (string) {
        userargs = string[1]
      } else {
        userargs = args[0]
      }
      try {
        if (args.join(" ").startsWith("-mania") || args.join(" ").startsWith("-ctb") || args.join(" ").startsWith("-taiko") || args.join(" ").startsWith("-rev") || args.join(" ").startsWith("-l") || args.join(" ").startsWith("-list")) {
          userargs = userData[message.author.id].osuUsername
        }
      } catch (err) {
        message.reply(`Set your osu! username by using "${prefix}link **your username**"`);
      }


      let pageNumber = Number(value)
      if (args === undefined) {
        pageNumber = Number("1")
      }
      if (args[0] === "-p") {
        pageNumber = Number(value)
        try {
          userargs = userData[message.author.id].osuUsername;
        } catch (err) {
          message.reply(`Set your osu! username by using "${prefix}link **your username**"`);
        }
      }

      const start = (pageNumber - 1) * 5 + 1;
      const end = pageNumber * 5;
      const numbers = [];
      for (let i = start; i <= end; i++) {
        numbers.push(i);
      }
      one = numbers[0] - 1;
      two = numbers[1] - 1;
      three = numbers[2] - 1;
      four = numbers[3] - 1;
      five = numbers[4] - 1;

      //score set
      let score = await v2.user.scores.category(user.id, 'best', {
        mode: mode,
        limit: "100",
        offset: "0",
      });


      if (args.includes("-reverse") || args.includes("-rev")) {
        score.sort((b, a) => new Date(b.created_at) - new Date(a.created_at))
      } else {
        score.sort((b, a) => new Date(a.created_at) - new Date(b.created_at))
      }

      const scores = [...score]
      scores.sort((a, b) => b.weight.percentage - a.weight.percentage)




      if (argValues["mods"] != undefined) {
        sortmod = 1
        filteredscore = score.filter(x => x.mods.join("").split("").sort().join("").toLowerCase() == argValues["mods"].split("").sort().join("").toLowerCase())
        score = filteredscore
        FilterMods = `**Filtering mod(s): ${score[value].mods.join("").toUpperCase()}**`
      }



      try {
        global_rank = user.statistics.global_rank.toLocaleString();
        country_rank = user.statistics.country_rank.toLocaleString();
        pp = user.statistics.pp.toLocaleString();
      } catch (err) {
        global_rank = "0"
        country_rank = "0"
        pp = "0"
      }


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
      }



      let scoreone = "**No plays found.**"
      let scoretwo = ""
      let scorethree = ""
      let scorefour = ""
      let scorefive = ""

      if (score[one]) {
        const Play_rank1 = scores.findIndex(play => play.id === score[one].id) + 1

        let grade = score[one].rank;
        grade = grades[grade];

        if (!fs.existsSync(`./osuFiles/${score[one].beatmap.id}.osu`)) {
          console.log("no file.")
          const downloader = new Downloader({
            rootPath: './osuFiles',

            filesPerSecond: 0,
          });

          downloader.addSingleEntry(score[one].beatmap.id)
          await downloader.downloadSingle()
        }



        let modsone = score[one].mods.join("")
        let modsID = mods.id(modsone)
        if (!modsone.length) {
          modsone = "NM"
          modsID = 0
        }

        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let map = new Beatmap({ path: `./osuFiles/${score[one].beatmap.id}.osu` })
        let calc = new Calculator(scoreParam)

        //normal pp
        let CurAttrs = calc.performance(map)


        const sr1 = CurAttrs.difficulty.stars.toFixed(2)
        time1 = new Date(score[one].created_at).getTime() / 1000


        scoreone = `**${Play_rank1}.** [**${score[one].beatmapset.title} [${score[one].beatmap.version}]**](https://osu.ppy.sh/b/${score[one].beatmap.id}) **+${modsone}** [${sr1}★]\n${grade} ▹ **${score[one].pp.toFixed(2)}PP** ▹ (${Number(score[one].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[one].max_combo)}x**/${CurAttrs.difficulty.maxCombo}x]\n${score[one].score.toLocaleString()} ▹ [**${score[one].statistics.count_300}**/${score[one].statistics.count_100}/${score[one].statistics.count_50}/${score[one].statistics.count_miss}] <t:${time1}:R>\n`
      }

      if (score[two]) {
        const Play_rank2 = scores.findIndex(play => play.id === score[two].id) + 1;

        let gradetwo = score[two].rank;
        gradetwo = grades[gradetwo];

        if (!fs.existsSync(`./osuFiles/${score[two].beatmap.id}.osu`)) {
          console.log("no file.")
          const downloader = new Downloader({
            rootPath: './osuFiles',

            filesPerSecond: 0,
          });

          downloader.addSingleEntry(score[two].beatmap.id)
          await downloader.downloadSingle()
        }



        let modsone = score[two].mods.join("")
        let modsID = mods.id(modsone)
        if (!modsone.length) {
          modsone = "NM"
          modsID = 0
        }

        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let map = new Beatmap({ path: `./osuFiles/${score[two].beatmap.id}.osu` })
        let calc = new Calculator(scoreParam)

        //normal pp
        let CurAttrs = calc.performance(map)

        const sr2 = CurAttrs.difficulty.stars.toFixed(2)
        time2 = new Date(score[two].created_at).getTime() / 1000

        scoretwo = `**${Play_rank2}.** [**${score[two].beatmapset.title} [${score[two].beatmap.version}]**](https://osu.ppy.sh/b/${score[two].beatmap.id}) **+${modsone}** [${sr2}★]\n${gradetwo} ▹ **${score[two].pp.toFixed(2)}PP** ▹ (${Number(score[two].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[two].max_combo)}x**/${CurAttrs.difficulty.maxCombo}x]\n${score[two].score.toLocaleString()} ▹ [**${score[two].statistics.count_300}**/${score[two].statistics.count_100}/${score[two].statistics.count_50}/${score[two].statistics.count_miss}] <t:${time2}:R>\n`
      }

      if (score[three]) {
        const Play_rank3 = scores.findIndex(play => play.id === score[three].id) + 1;

        let gradethree = score[three].rank;
        gradethree = grades[gradethree];

        if (!fs.existsSync(`./osuFiles/${score[three].beatmap.id}.osu`)) {
          console.log("no file.")
          const downloader = new Downloader({
            rootPath: './osuFiles',

            filesPerSecond: 0,
          });

          downloader.addSingleEntry(score[three].beatmap.id)
          await downloader.downloadSingle()
        }



        let modsone = score[three].mods.join("")
        let modsID = mods.id(modsone)
        if (!modsone.length) {
          modsone = "NM"
          modsID = 0
        }

        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let map = new Beatmap({ path: `./osuFiles/${score[three].beatmap.id}.osu` })
        let calc = new Calculator(scoreParam)

        //normal pp
        let CurAttrs = calc.performance(map)

        const sr3 = CurAttrs.difficulty.stars.toFixed(2)
        time3 = new Date(score[three].created_at).getTime() / 1000

        scorethree = `**${Play_rank3}.** [**${score[three].beatmapset.title} [${score[three].beatmap.version}]**](https://osu.ppy.sh/b/${score[three].beatmap.id}) **+${modsone}** [${sr3}★]\n${gradethree} ▹ **${score[three].pp.toFixed(2)}PP** ▹ (${Number(score[three].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[three].max_combo)}x**/${CurAttrs.difficulty.maxCombo}x]\n${score[three].score.toLocaleString()} ▹ [**${score[three].statistics.count_300}**/${score[three].statistics.count_100}/${score[three].statistics.count_50}/${score[three].statistics.count_miss}] <t:${time3}:R>\n`
      }

      if (score[four]) {
        const Play_rank4 = scores.findIndex(play => play.id === score[four].id) + 1;

        let gradefour = score[four].rank;
        gradefour = grades[gradefour];

        if (!fs.existsSync(`./osuFiles/${score[four].beatmap.id}.osu`)) {
          console.log("no file.")
          const downloader = new Downloader({
            rootPath: './osuFiles',

            filesPerSecond: 0,
          });

          downloader.addSingleEntry(score[four].beatmap.id)
          await downloader.downloadSingle()
        }



        let modsone = score[four].mods.join("")
        let modsID = mods.id(modsone)
        if (!modsone.length) {
          modsone = "NM"
          modsID = 0
        }

        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let map = new Beatmap({ path: `./osuFiles/${score[four].beatmap.id}.osu` })
        let calc = new Calculator(scoreParam)

        //normal pp
        let CurAttrs = calc.performance(map)

        const sr4 = CurAttrs.difficulty.stars.toFixed(2)
        time4 = new Date(score[four].created_at).getTime() / 1000

        scorefour = `**${Play_rank4}.** [**${score[four].beatmapset.title} [${score[four].beatmap.version}]**](https://osu.ppy.sh/b/${score[four].beatmap.id}) **+${modsone}** [${sr4}★]\n${gradefour} ▹ **${score[four].pp.toFixed(2)}PP** ▹ (${Number(score[four].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[four].max_combo)}x**/${CurAttrs.difficulty.maxCombo}x]\n${score[four].score.toLocaleString()} ▹ [**${score[four].statistics.count_300}**/${score[four].statistics.count_100}/${score[four].statistics.count_50}/${score[four].statistics.count_miss}] <t:${time4}:R>\n`
      }

      if (score[five]) {
        const Play_rank5 = scores.findIndex(play => play.id === score[five].id) + 1;

        let gradefive = score[five].rank;
        gradefive = grades[gradefive];

        if (!fs.existsSync(`./osuFiles/${score[five].beatmap.id}.osu`)) {
          console.log("no file.")
          const downloader = new Downloader({
            rootPath: './osuFiles',

            filesPerSecond: 0,
          });

          downloader.addSingleEntry(score[five].beatmap.id)
          await downloader.downloadSingle()
        }



        let modsone = score[five].mods.join("")
        let modsID = mods.id(modsone)
        if (!modsone.length) {
          modsone = "NM"
          modsID = 0
        }

        let scoreParam = {
          mode: RuleSetId,
          mods: modsID,
        }

        let map = new Beatmap({ path: `./osuFiles/${score[five].beatmap.id}.osu` })
        let calc = new Calculator(scoreParam)

        //normal pp
        let CurAttrs = calc.performance(map)

        const sr5 = CurAttrs.difficulty.stars.toFixed(2)

        time5 = new Date(score[five].created_at).getTime() / 1000

        scorefive = `**${Play_rank5}.** [**${score[five].beatmapset.title} [${score[five].beatmap.version}]**](https://osu.ppy.sh/b/${score[five].beatmap.id}) **+${modsone}** [${sr5}★]\n${gradefive} ▹ **${score[five].pp.toFixed(2)}PP** ▹ (${Number(score[five].accuracy * 100).toFixed(2)}%) ▹ [**${Number(score[five].max_combo)}x**/${CurAttrs.difficulty.maxCombo}x]\n${score[five].score.toLocaleString()} ▹ [**${score[five].statistics.count_300}**/${score[five].statistics.count_100}/${score[five].statistics.count_50}/${score[five].statistics.count_miss}] <t:${time5}:R>`
      }


      const pageTotal = Math.ceil(score.length / 5)




      //embed
      const embed = new EmbedBuilder()
        .setColor('Purple')
        .setAuthor({
          name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
          iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
          url: `https://osu.ppy.sh/u/${user.id}`,
        })
        .setThumbnail(user.avatar_url)
        .setDescription(`${scoreone}${scoretwo}${scorethree}${scorefour}${scorefive}`)
        .setFooter({ text: `Page ${pageNumber}/${pageTotal}` });

      message.channel.send({ content: FilterMods, embeds: [embed] });

      console.log(value, userargs)


      return;
    }

    try {

      if (args.includes('-i')) {
        const iIndex = args.indexOf('-i');
        value = args[iIndex + 1] - 1
      } else {
        value = 0
      }


      //score set
      let score = await v2.user.scores.category(user.id, "best", {
        mode: mode,
        limit: "100",
        offset: "0",
      });

      //score sorting
      if (args.includes("-reverse") || args.includes("-rev")) {
        score.sort((b, a) => new Date(b.created_at) - new Date(a.created_at))
      } else {
        score.sort((b, a) => new Date(a.created_at) - new Date(b.created_at))
      }

      const scores = [...score]
      scores.sort((a, b) => b.weight.percentage - a.weight.percentage)
      const Play_rank = scores.findIndex(play => play.id === score[value].id) + 1;


      if (argValues["mods"] != undefined) {
        sortmod = 1
        filteredscore = score.filter(x => x.mods.join("").split("").sort().join("").toLowerCase() == argValues["mods"].split("").sort().join("").toLowerCase())
        score = filteredscore
        FilterMods = `**Filtering mod(s): ${score[value].mods.join("").toUpperCase()}**`
      }


      if (!fs.existsSync(`./osuFiles/${score[value].beatmap.id}.osu`)) {
        console.log("no file.")
        const downloader = new Downloader({
          rootPath: './osuFiles',

          filesPerSecond: 0,
        });

        downloader.addSingleEntry(score[value].beatmap.id)
        await downloader.downloadSingle()
      }



      let modsone = score[value].mods.join("")
      let modsID = mods.id(modsone)
      if (!modsone.length) {
        modsone = "NM"
        modsID = 0
      }

      let scoreParam = {
        mode: RuleSetId,
        mods: modsID,
      }

      let map = new Beatmap({ path: `./osuFiles/${score[value].beatmap.id}.osu` })
      let calc = new Calculator(scoreParam)

      const mapValues = calc.mapAttributes(map)


      // ss pp
      let maxAttrs = calc.performance(map)

      //normal pp
      let CurAttrs = calc
        .n100(score[value].statistics.count_100)
        .n300(score[value].statistics.count_300)
        .n50(score[value].statistics.count_50)
        .nMisses(Number(score[value].statistics.count_miss))
        .combo(score[value].max_combo)
        .nGeki(score[value].statistics.count_geki)
        .nKatu(score[value].statistics.count_katu)
        .performance(map)

      //fc pp
      let FCAttrs = calc
        .n100(score[value].statistics.count_100)
        .n300(score[value].statistics.count_300)
        .n50(score[value].statistics.count_50)
        .nMisses(0)
        .combo(maxAttrs.difficulty.maxCombo)
        .nGeki(score[value].statistics.count_geki)
        .nKatu(score[value].statistics.count_katu)
        .performance(map)

      console.log(CurAttrs)


      //formatted values for user
      try {
        global_rank = user.statistics.global_rank.toLocaleString();
        country_rank = user.statistics.country_rank.toLocaleString();
      } catch (err) {
        global_rank = 0
        country_rank = 0
      }
      let user_pp = user.statistics.pp.toLocaleString();

      //hits
      let three = score[value].statistics.count_300
      let one = score[value].statistics.count_100
      let fifty = score[value].statistics.count_50
      let miss = Number(score[value].statistics.count_miss);


      //calculating pass percentage
      let objects = score[value].beatmap.count_circles + score[value].beatmap.count_sliders + score[value].beatmap.count_spinners
      let objectshit = score[value].statistics.count_300 +
        score[value].statistics.count_100 +
        score[value].statistics.count_50 +
        score[value].statistics.count_miss;
      let fraction = objectshit / objects;
      let percentage_raw = Number((fraction * 100).toFixed(2));
      let percentagenum = percentage_raw.toFixed(1);
      let percentage = `(${percentagenum}%)`;
      if (percentagenum == "100.0") {
        percentage = " ";
      }

      //formatted values for score
      let map_score = score[value].score.toLocaleString();
      let acc = `**(${Number(score[value].accuracy * 100).toFixed(2)}%)**`

      //score set at   
      time1 = new Date(score[value].created_at).getTime() / 1000

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
      let grade = score[value].rank;
      grade = grades[grade];

      //set title
      let title = `${score[value].beatmapset.artist} - ${score[value].beatmapset.title} [${score[value].beatmap.version}] [${maxAttrs.difficulty.stars.toFixed(2)}★]`;


      pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`
      if (CurAttrs.effectiveMissCount > 0) {
        Map300CountFc = objects - score[value].statistics.count_100 - score[value].statistics.count_50

        const FcAcc = tools.accuracy({
          "300": Map300CountFc,
          "geki": score[value].statistics.count_geki,
          "100": score[value].statistics.count_100,
          "katu": score[value].statistics.count_katu,
          "50": score[value].statistics.count_50,
          "0": 0,
          mode: "osu"
        })

        pps = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP ▹ (**${FCAttrs.pp.toFixed(2)}**PP for **${FcAcc}%**)`
      }




      //length
      let Hit = score[value].beatmap.hit_length
      let Total = score[value].beatmap.total_length

      let minutesHit = Math.floor(Hit / 60)
      let secondsHit = (Hit % 60).toString().padStart(2, "0");
      let minutesTotal = Math.floor(Total / 60)
      let secondsTotal = (Total % 60).toString().padStart(2, "0");

      let scorerank = await v2.scores.details(score[value].best_id, 'osu')
      if (score[value].passed == true) {
        if (scorerank.rank_global != undefined) {
          sc_rank = ` 🌐 #${scorerank.rank_global}`
        } else {
          sc_rank = " "
        }

      } else if (score[value].passed == false) {
        sc_rank = " "
      }

      let status = score[value].beatmapset.status.charAt(0).toUpperCase() + score[value].beatmapset.status.slice(1)

      //score embed
      const embed = new EmbedBuilder()
        .setColor('Purple')
        .setAuthor({
          name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
          iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
          url: `https://osu.ppy.sh/u/${user.id}`,
        })
        .setTitle(title)
        .setURL(`https://osu.ppy.sh/b/${score[value].beatmap.id}`)
        .setDescription(`${grade} **${percentage} +${modsone}** ${sc_rank} (**🤵#${Play_rank}**) \n▹${pps} \n▹${map_score} • ${acc}\n▹[ **${score[value].max_combo}**x/${maxAttrs.difficulty.maxCombo}x ] • { **${three}**/${one}/${fifty}/${miss} } \n▹Score Set <t:${time1}:R>`)
        .setFields({
          name: `**Beatmap info:**`, value: `BPM: \`${mapValues.bpm?.toFixed()}\` Objects: \`${objects.toLocaleString()}\` Length: \`${minutesTotal}:${secondsTotal}\` (\`${minutesHit}:${secondsHit}\`)\nAR: \`${maxAttrs.difficulty.ar?.toFixed(1).toString().replace(/\.0+$/, "")}\` OD: \`${maxAttrs.difficulty.od?.toFixed(1).toString().replace(/\.0+$/, "")}\` CS: \`${mapValues.cs?.toFixed(1).toString().replace(/\.0+$/, "")}\` HP: \`${mapValues.hp?.toFixed(2).toString().replace(/\.0+$/, "")}\``
        })
        .setThumbnail(`https://assets.ppy.sh/beatmaps/${score[value].beatmapset.id}/covers/list.jpg`)
        .setFooter({ text: `${status} map by ${score[value].beatmapset.creator}`, iconURL: `https://a.ppy.sh/${score[value].beatmapset.user_id}?1668890819.jpeg` })

      //send embed
      message.channel.send({ content: FilterMods, embeds: [embed] })

    } catch (err) {
      console.log(err);
      message.channel.send(`the user **${userargs}** doesn't exist, or no recent plays`);
      return;
    }


  });
};
exports.name = ["recentbest"];
exports.aliases = ["recentbest", "rb", "rsb"]
exports.description = ["Displays user's most recent top 100 osu!standard play\n\n**Parameters:**\n\`-i (int)\` get the latest play by number (1-100)\n\`-l\` get a list of recent best plays\n\`-p (int)\` specify the page of the list"]
exports.usage = [`rb {username}`]
exports.category = ["osu"]
