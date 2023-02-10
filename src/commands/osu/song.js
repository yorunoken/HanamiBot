const { auth, v2 } = require('osu-api-extended');
const fs = require('fs');
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  let EmbedValue = 0
  let GoodToGo = false

  await auth.login(process.env.client_id, process.env.client_secret);

  const channel = client.channels.cache.get(message.channel.id);
  channel.messages.fetch({ limit: 100 }).then(async messages => {
    //find the latest message with an embed
    let embedMessages = [];
    for (const [id, message] of messages) {
      if (message.embeds.length > 0 && message.author.bot) {
        embedMessages.push(message);
      }
    }

    async function SendEmbed(ranked) {
      try {
        await auth.login_lazer(process.env.userd, process.env.pass);

        await message.channel.send(`Downloading \`${ranked.beatmapset.title}\``)


        await v2.beatmap.download(ranked.beatmapset_id, `./beatmapsongs/${ranked.beatmapset_id}.osz`)
        await message.channel.send({ content: `<@${message.author.id}> osz of \`${ranked.beatmapset.title}\``, files: [`./beatmapsongs/${ranked.beatmapset_id}.osz`] });

        return;

      } catch (err) {
        console.log(err)
      }

    }

    async function EmbedFetch(embed) {
      try {

        const embed_author = embed.url
        const beatmapId = embed_author.match(/\d+/)[0]

        const ranked = await v2.beatmap.diff(beatmapId)
        if (ranked.id == undefined) throw new Error("No URL")
        //send the embed
        await SendEmbed(beatmapId)
        GoodToGo = true
        return;

      } catch (err) {
        console.log(err)

        console.log('err found, switching to author')


        try {

          const embed_author = embed.author.url
          const beatmapId = embed_author.match(/\d+/)[0]

          const ranked = await v2.beatmap.diff(beatmapId)
          if (ranked.id == undefined) throw new Error("No Author")

          //send the embed
          await SendEmbed(beatmapId)
          GoodToGo = true
          return;

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
            await SendEmbed(beatmapId)
            GoodToGo = true
            return;

          } catch (err) {
            console.log(err)
            EmbedValue++
          }
        }

      }
    }

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
        await SendEmbed(ranked)
        return;
      }
    } catch (err) {

      try{
        if (embedMessages) {
          do{
            if(!embedMessages[EmbedValue].embeds[0]) break;
            const embed = embedMessages[EmbedValue].embeds[0];
            await EmbedFetch(embed)
            console.log(GoodToGo)
          }
          while(!GoodToGo)
  
        } else {
          await message.channel.send('No embeds found in the last 100 messages');
        }
      }catch(err){
        message.channel.send("**No maps found**")
      }
    }



  })
};

exports.name = "song";
exports.aliases = ["song"]
exports.description = ["Sends the .osz file of a beatmap. also takes beatmap links\n**Note: the bot will not send the file if it's above the file upload limit.**"]
exports.usage = [`song https://osu.ppy.sh/b/1528368`]
exports.category = ["osu"]