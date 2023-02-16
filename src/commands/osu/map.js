const { EmbedBuilder } = require("discord.js");
const { v2, auth } = require("osu-api-extended");
const { BeatmapCalculator, ScoreCalculator } = require('@kionell/osu-pp-calculator')
const scoreCalculator = new ScoreCalculator()
const beatmapCalculator = new BeatmapCalculator();
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  let ErrCount = 0
  let EmbedValue = 0
  let GoodToGo = false

  await auth.login(process.env.client_id, process.env.client_secret);

  let argValues = {};
  for (const arg of args) {
    const [key, value] = arg.split("=");
    argValues[key] = value;
  }

  //if mods is undefined, set it to NM
  if (typeof argValues['mods'] === 'undefined' || argValues['mods'] === '') {
    argValues['mods'] = "NM"
  }

  if (args.join(" ").includes("+")) {
    const iIndex = args.indexOf("+")
    modsArg = (args[iIndex + 1].slice(1)).toUpperCase().match(/[A-Z]{2}/g)
    argValues['mods'] = modsArg.join("")
  }

  async function SendEmbed(ranked, beatmapId) {
    try {
      //map


      if (!argValues['cs']) {
        cs = undefined
      } else {
        cs = Number(argValues['cs'])
      }

      if (!argValues['ar']) {
        ar = undefined
      } else {
        ar = Number(argValues['ar'])
      }

      if (!argValues['od']) {
        od = undefined
      } else {
        od = Number(argValues['od'])
      }

      if (!argValues['bpm']) {
        bpm = undefined
      } else {
        bpm = Number(argValues['bpm'])
      }
      const map = await beatmapCalculator.calculate({
        beatmapId: beatmapId,
        mods: argValues['mods'],
        accuracy: [95, 97, 99, 100],
        circleSize: cs,
        approachRate: ar,
        overallDifficulty: od,
        bpm: bpm,
      })

      let AccPP;
      if (argValues['acc']) {
        const mapacc = await beatmapCalculator.calculate({
          beatmapId: beatmapId,
          mods: argValues['mods'],
          accuracy: [Number(argValues['acc'])],
          circleSize: cs,
          approachRate: ar,
          overallDifficulty: od,
          bpm: bpm,
        })
        AccPP = ` ${Number(asd).toFixed(2)}%: ${mapacc.performance[0].totalPerformance.toFixed(1)}`
      } else {
        AccPP = ""
      }
      //length
      let length = map.beatmapInfo.length.toFixed(0)
      let minutes = Math.floor(length / 60)
      let seconds = (length % 60).toString().padStart(2, "0");

      //ranked or not
      let status = (ranked.status.charAt(0)).toUpperCase() + ranked.status.slice(1)

      //embed
      const embed = new EmbedBuilder()
        .setColor('Purple')
        .setAuthor({ name: `Beatmap by ${map.beatmapInfo.creator}`, url: `https://osu.ppy.sh/users/${ranked.user_id}`, iconURL: `https://a.ppy.sh/${ranked.user_id}?1668890819.jpeg` })
        .setTitle(`${map.beatmapInfo.artist} - ${map.beatmapInfo.title}`)
        .setDescription(`Stars: \`${map.difficulty.starRating.toFixed(2)}★\` BPM: \`${map.beatmapInfo.bpmMode.toFixed()}\` Mods: \`${map.difficulty.mods}\`\n 🗺️ **[${map.beatmapInfo.version}]**\n- Combo: \`${map.difficulty.maxCombo.toLocaleString()}x\` Length: \`${minutes}:${seconds}\` Objects: \`${(map.beatmapInfo.hittable + map.beatmapInfo.slidable + map.beatmapInfo.spinnable).toLocaleString()}\`\n - AR: \`${map.difficulty.approachRate.toFixed(1)}\` OD: \`${map.difficulty.overallDifficulty.toFixed(1)}\` CS: \`${map.beatmapInfo.circleSize.toFixed(2)}\` HP: \`${map.difficulty.drainRate.toFixed(1)}\``)
        .setFields(
          { name: 'PP', value: `\`\`\`Acc  | PP\n95%: ${map.performance[0].totalPerformance.toFixed(1)}\n97%: ${map.performance[1].totalPerformance.toFixed(1)}\n99%: ${map.performance[2].totalPerformance.toFixed(1)}\n100%: ${map.performance[3].totalPerformance.toFixed(1)}${AccPP}\`\`\``, inline: true },
          { name: 'Links', value: '[Song Preview](https://b.ppy.sh/preview/${map.beatmapInfo.beatmapsetId}.mp3)\n[Download Mapset](https://osu.ppy.sh/beatmapsets/${map.beatmapInfo.beatmapsetId}/download)\n[Beatconnect](https://beatconnect.io/b/${map.beatmapInfo.beatmapsetId})', inline: true }
        )
        .setURL(`https://osu.ppy.sh/b/${map.beatmapInfo.id}`)
        .setImage(`https://assets.ppy.sh/beatmaps/${map.beatmapInfo.beatmapsetId}/covers/cover.jpg`)
        .setFooter({ text: `${status} | ${ranked.beatmapset.favourite_count} ♥` })

      message.channel.send({ embeds: [embed] })
      return;
    } catch (err) {
      console.log(err)
      // ErrCount++
    }
  }

  async function EmbedFetch(embed) {
    try {
      const embed_author = embed.url
      const beatmapId = embed_author.match(/\d+/)[0]
      console.log(beatmapId)

      const ranked = await v2.beatmap.diff(beatmapId)

      if (ranked.id == undefined) throw new Error("No URL")
      //send the embed
      await SendEmbed(ranked, beatmapId)
      GoodToGo = true


    } catch (err) {
      console.log(err)

      console.log('err found, switching to author')


      try {

        const embed_author = embed.author.url
        const beatmapId = embed_author.match(/\d+/)[0]

        const ranked = await v2.beatmap.diff(beatmapId)
        if (ranked.id == undefined) throw new Error("No Author")

        //send the embed
        await SendEmbed(ranked, beatmapId)
        GoodToGo = true

      } catch (err) {
        console.log(err)

        console.log('err found, switching to desc')
        try {
          const regex = /\/b\/(\d+)/;
          const match = regex.exec(embed.description);
          const beatmapId = match[1];

          const ranked = await v2.beatmap.diff(beatmapId)
          if (ranked.id == undefined) throw new Error("No Desc")
          //send the embed
          await SendEmbed(ranked, beatmapId)
          GoodToGo = true
          return;
        } catch (err) {
          EmbedValue++
          ErrCount++
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







    /**
    * TODO: Add a function to loop the SendEmbed function if no embeds are found
    */





    // let ErrCount = 0
    try {
      if (args) {
        //if args doesn't start with https: try to get the beatmap id by number provided
        if (!args[0].startsWith("https:")) {
          beatmapId = args[0]
        } else {
          //try to get beatmapId by link
          const regex = /\/(\d+)$/
          const match = regex.exec(args[0])
          beatmapId = match[1]
        }


        const ranked = await v2.beatmap.diff(beatmapId)
        if (ranked.id == undefined) throw new Error("No html")

        //send the embed
        await SendEmbed(ranked, beatmapId)
        return
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



};
exports.name = "map"
exports.aliases = ["map", "m"]
exports.description = ["Displays the stats of a beatmap.\n\n**Parameters:**\n\`link\` get map by beatmap link\n\`BPM=(int)\` changes the BPM of the beatmap and gives its info (50-4000) also scales up other values with it\n\`AR=(int)\` changes the AR of the map\n\`OD=(int)\` changes the OD of the map\n\`CS=(int)\` changes the circle size of the map\n\`mods=(string)\` gets the beatmap info based on the mod combination"]
exports.usage = ["map {link} {args}"]
exports.category = ["osu"]
