// require('fetch')
const axios = require('axios');
const { v2, auth, mods, tools } = require("osu-api-extended");

// importing GetRecent
const { LbSend } = require('../../exports/leaderboard_export.js')
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


  let modsArg;
  let SortArg = "";
  let modifiedMods
  if (args.join(" ").includes("+")) {
    const iIndex = args.indexOf("+")
    modsArg = (args[iIndex + 1].slice(1)).toUpperCase().match(/[A-Z]{2}/g)
    SortArg = `, Sorting by: ${modsArg}`
    if (args[0].startsWith("https://")) {
      modsArg = (args[iIndex + 2].slice(1)).toUpperCase().match(/[A-Z]{2}/g)
    }
    modifiedMods = modsArg.map((mod) => `&mods[]=${mod}`).join("")
  } else {
    modifiedMods = ""
    SortArg = "";
  }


  async function SendEmbed(beatmapId, scores, pagenum) {
    message.channel.send({content: `Turkish LB${SortArg}`,embeds: [await LbSend(beatmapId, scores, pagenum)]})
  }

  async function EmbedFetch(embed) {
    try {
      const embed_author = embed.url
      const beatmapId = embed_author.match(/\d+/)[0]

      console.log(`url ${beatmapId}`)
      const response = await axios.get(`https://osu.ppy.sh/beatmaps/${beatmapId}/scores?mode=${GameMode}&type=country${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } })
      const scores = response.data
      //send the embed
      SendEmbed(beatmapId, scores, pagenum)
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
        SendEmbed(beatmapId, scores, pagenum)
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
          SendEmbed(beatmapId, scores, pagenum)
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
          SendEmbed(beatmapId, scores, pagenum)
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


};
exports.name = "countrylb";
exports.aliases = ["countrylb", "ct", "clb", "cleaderboard", "countrytop", "countryt"]
exports.description = ["Displays the Country (Turkey only) leaderboard of a map.\n\n**Parameters:**\n\`link\` link a beatmap to get its leaderboard\n\`+(mod combination)\` get the leaderboard of that mod combination"]
exports.usage = [`ct https://osu.ppy.sh/b/2039543 +nf`]
exports.category = ["osu"]