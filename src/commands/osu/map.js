const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const { v2, auth, tools, mods } = require("osu-api-extended");
const { Beatmap, Calculator } = require('rosu-pp')
const { Downloader, DownloadEntry } = require("osu-downloader")

exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

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

      if (!fs.existsSync(`./osuFiles/${beatmapId}.osu`)) {
        console.log("no file.")
        const downloader = new Downloader({
          rootPath: './osuFiles',

          filesPerSecond: 0,
        });

        downloader.addSingleEntry(beatmapId)
        await downloader.downloadSingle()
      }

      if (args.join(" ").includes("-a")) {
        const iIndex = args.indexOf("-a")
        modsArg = args[iIndex + 1]
        argValues['acc'] = modsArg
      }

      if (args.join(" ").includes("-acc")) {
        const iIndex = args.indexOf("-acc")
        modsArg = args[iIndex + 1]
        argValues['acc'] = modsArg
      }

      if (!argValues["mods"]) argValues["mods"] = "NM";
      const modsID = mods.id(argValues["mods"]);

      const RuleSetId = ranked.mode_int;
      let scoreParam = {
        mode: RuleSetId,
        mods: modsID,
      }

      let map = new Beatmap({ path: `./osuFiles/${beatmapId}.osu` })
      let calc = new Calculator(scoreParam)

      const mapValues = calc.mapAttributes(map)

      const PP100 = calc.acc(100).performance(map)
      const PP99 = calc.acc(99).performance(map)
      const PP97 = calc.acc(97).performance(map)
      const PP95 = calc.acc(95).performance(map)

      let AccPP = ""
      if (argValues['acc']) {
        const PPif = calc.acc(Number(argValues['acc'])).performance(map)
        AccPP = `\n${Number(argValues['acc'])}%: ${PPif.pp.toFixed(1)}`
      }
      if (Number(argValues['acc']) < 16.67) {
        const PPif = calc.acc(16.67).performance(map)
        AccPP = `\n16.67%: ${PPif.pp.toFixed(1)}`
      }


      if (!PP100.difficulty.nCircles) PP100.difficulty.nCircles = 0
      if (!PP100.difficulty.nSliders) PP100.difficulty.nSliders = 0
      if (!PP100.difficulty.nSpinners) PP100.difficulty.nSpinners = 0
      if (!PP100.difficulty.nFruits) PP100.difficulty.nFruits = 0

      let osuEmote
      if (ranked.mode == "osu") osuEmote = "<:osu:1075928459014066286>"
      if (ranked.mode == "mania") osuEmote = "<:mania:1075928451602718771>"
      if (ranked.mode == "taiko") osuEmote = "<:taiko:1075928454651969606>"
      if (ranked.mode == "fruits") osuEmote = "<:ctb:1075928456367444018>"

      //length
      let length = ranked.total_length.toFixed(0)
      let minutes = Math.floor(length / 60)
      let seconds = (length % 60).toString().padStart(2, "0")

      //ranked or not
      let status = (ranked.status.charAt(0)).toUpperCase() + ranked.status.slice(1)

      //embed
      const embed = new EmbedBuilder()
        .setColor('Purple')
        .setAuthor({ name: `Beatmap by ${ranked.beatmapset.creator}`, url: `https://osu.ppy.sh/users/${ranked.user_id}`, iconURL: `https://a.ppy.sh/${ranked.user_id}?1668890819.jpeg` })
        .setTitle(`${ranked.beatmapset.artist} - ${ranked.beatmapset.title}`)
        .setFields(
          { name: `${osuEmote} **[${ranked.version}]**`, value: `Stars: \`${PP100.difficulty.stars.toFixed(2)}★\` Mods: \`${argValues["mods"]}\` BPM: \`${mapValues.bpm.toFixed()}\`\nLength: \`${minutes}:${seconds}\` Max Combo: \`${PP100.difficulty.maxCombo.toLocaleString()}x\` Objects: \`${PP100.difficulty.nCircles + PP100.difficulty.nSliders + PP100.difficulty.nSpinners + PP100.difficulty.nFruits}\`\nAR: \`${mapValues.ar.toFixed(1)}\` OD: \`${mapValues.od.toFixed(1)}\` CS: \`${mapValues.cs.toFixed(2)}\` HP: \`${mapValues.hp.toFixed(1)}\`` },
          { name: 'PP', value: `\`\`\`Acc | PP\n95%: ${PP95.pp.toFixed(1)}\n97%: ${PP97.pp.toFixed(1)}\n99%: ${PP99.pp.toFixed(1)}\n100%: ${PP100.pp.toFixed(1)}${AccPP}\`\`\``, inline: true },
          { name: 'Links', value: `:notes:[Song Preview](https://b.ppy.sh/preview/${ranked.beatmapset_id}.mp3)\n🖼️[Full Background](https://assets.ppy.sh/beatmaps/${ranked.beatmapset_id}/covers/raw.jpg)\n<:beatconnect:1075915329512931469>[Beatconnect](https://beatconnect.io/b/${ranked.beatmapset_id})\n<:kitsu:1075915745973776405>[Kitsu](https://kitsu.moe/d/${ranked.beatmapset_id})`, inline: true },
        )
        .setURL(`https://osu.ppy.sh/b/${ranked.id}`)
        .setImage(`https://assets.ppy.sh/beatmaps/${ranked.beatmapset_id}/covers/cover.jpg`)
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
