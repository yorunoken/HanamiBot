const fs = require("fs")
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js")
const { v2, auth } = require("osu-api-extended")
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  fs.readFile("./user-data.json", async (error, data) => {
    if (error) {
      console.log(error)
      return message.reply("An error occurred while reading user data.")
    }
    const userData = JSON.parse(data)
    let userargs
    let mode = userData[message.author.id].osumode
    if(mode == undefined) mode = "osu"

    if (message.mentions.users.size > 0) {
      const mentionedUser = message.mentions.users.first()
      try {
        if (mentionedUser) {
          userargs = userData[message.author.id].osuUsername
          if (message.content.includes(`<@${mentionedUser.id}>`)) {
            userargs = userData[mentionedUser.id].osuUsername
          }
        }
      } catch (err) {
        console.error(err)
        if (mentionedUser) {
          if (message.content.includes(`<@${mentionedUser.id}>`)) {
            try {
              userargs = userData[mentionedUser.id].osuUsername
            } catch (err) {
              message.reply(`No osu! user found for ${mentionedUser.tag}`)
            }
          } else {
            try {
              userargs = userData[message.author.id].osuUsername
            } catch (err) {
              message.reply(
                `Set your osu! username by using "${prefix}link **your username**"`
              )
            }
          }
        }
        return
      }
    } else {
      if (args[0] === undefined) {
        try {
          userargs = userData[message.author.id].osuUsername
        } catch (err) {
          console.error(err)
          message.reply(
            `Set your osu! username by using "${prefix}link **your username**"`
          )
          return
        }
      } else {
        let string = args.join(" ").match(/"(.*?)"/)
        if (string) {
          userargs = string[1]
        } else {
          userargs = args[0]
        }
      }
    }

    if (args.includes("-mania")) {
      mode = "mania"
    }
    if (args.includes("-taiko")) {
      mode = "taiko"
    }
    if (args.includes("-ctb")) {
      mode = "fruits"
    }

    if (args.includes("-osu")) {
      mode = "osu"
    }

    if (
      args.join(" ").startsWith("-mania") ||
      args.join(" ").startsWith("-ctb") ||
      args.join(" ").startsWith("-taiko") ||
      args.join(" ").startsWith("-osu") ||
      args.join(" ").startsWith("-d") ||
      args.join(" ").startsWith("-details")
    ) {
      try {
        userargs = userData[message.author.id].osuUsername
      } catch (err) {
        message.reply(
          `Set your osu! username by using "${prefix}link **your username**"`
        )
      }
    }

    userData[message.author.id] = {
      ...userData[message.author.id],
      temp_osu: userargs,
    }
    fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
      if (error) {
        console.log(error)
      } else {
      }
    })





    //log into api
    await auth.login(process.env.client_id, process.env.client_secret)

    userargs = userData[message.author.id].temp_osu


    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("less")
        .setLabel("Less details")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(),

      new ButtonBuilder()
        .setCustomId("more")
        .setLabel("More details")
        .setStyle(ButtonStyle.Primary)

    )

    const button2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("less")
        .setLabel("Less details")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("more")
        .setLabel("More details")
        .setStyle(ButtonStyle.Primary)
        .setDisabled()
    )



    async function getUserFirstPage(user) {


      try {
        global_rank = user.statistics.global_rank.toLocaleString()
        country_rank = user.statistics.country_rank.toLocaleString()
        pp = user.statistics.pp.toLocaleString()
      } catch (err) {
        global_rank = "0"
        country_rank = "0"
        pp = "0"
      }

      acc = user.statistics.hit_accuracy.toFixed(2)
      lvl = user.statistics.level.progress
      lvlprogress = lvl.toString(10).padStart(2, "0")
      playcount = user.statistics.play_count.toLocaleString()
      playhours = user.statistics.play_time.toFixed(4) / 3600
      followers = user.follower_count.toLocaleString()
      profile_maxcombo = user.statistics.maximum_combo.toLocaleString()


      //ranks
      let ssh = user.statistics.grade_counts.ssh.toLocaleString()
      let ss = user.statistics.grade_counts.ss.toLocaleString()
      let sh = user.statistics.grade_counts.sh.toLocaleString()
      let s = user.statistics.grade_counts.s.toLocaleString()
      let a = user.statistics.grade_counts.a.toLocaleString()

      //grades
      const grades = {
        A: "<:A_:1057763284327080036>",
        S: "<:S_:1057763291998474283>",
        SH: "<:SH_:1057763293491642568>",
        X: "<:X_:1057763294707974215>",
        XH: "<:XH_:1057763296717045891>",
      }


      //join date
      const dateString = user.join_date
      const date = new Date(dateString)
      //current time
      const currenttime = new Date()
      const timedifference = currenttime - date
      //convert the time difference to months
      const months = Math.floor(timedifference / (1000 * 60 * 60 * 24 * 30))
      const user_joined = months / 12
      const user_joined_ago = user_joined.toFixed(1)
      //joindate
      const options = {
        hour: "2-digit",
        minute: "2-digit",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }
      const formattedDate = date.toLocaleDateString("en-US", options)

      //time get
      time = new Date(user.rank_highest.updated_at).getTime() / 1000


      //embed
      const embed = new EmbedBuilder()
        .setColor("Purple")
        .setAuthor({
          name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
          iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
          url: `https://osu.ppy.sh/u/${user.id}/${mode}`,
        })
        .setThumbnail(user.avatar_url)
        .setDescription(
          `**Accuracy:** \`${acc}%\` •  **Level:** \`${user.statistics.level.current
          }.${lvlprogress}\`\n**Peak Rank:** \`#${user.rank_highest.rank.toLocaleString()}\` • **Achieved:** <t:${time}:R>\n**Playcount:** \`${playcount}\` (\`${playhours.toFixed()} hrs\`)\n**Followers:** \`${followers}\` • **Max Combo:** \`${profile_maxcombo}\`\n**Ranks:** ${grades.XH
          }\`${ssh}\`${grades.X}\`${ss}\`${grades.SH}\`${sh}\`${grades.S
          }\`${s}\`${grades.A}\`${a}\``
        )
        .setImage(user.cover_url)
        .setFooter({
          text: `Joined osu! ${formattedDate} (${user_joined_ago} years ago)`,
        })
      return embed;

    }

    async function getUserSecondPage(user) {

      const tops = await v2.user.scores.category(user.id, "best", {
        mode: mode,
        limit: "100",
        offset: "0",
      })

      try {
        global_rank = user.statistics.global_rank.toLocaleString()
        country_rank = user.statistics.country_rank.toLocaleString()
        pp = user.statistics.pp.toLocaleString()
        pp_spread_raw = tops[0].pp - tops[tops.length - 1].pp
        pp_spread_num = pp_spread_raw.toFixed(2)
      } catch (err) {
        global_rank = "0"
        country_rank = "0"
        pp = "0"
        pp_spread_raw = "0"
        pp_spread_num = "0"
      }

      replays_watched = user.statistics.replays_watched_by_others.toLocaleString()
      medal_count = user.user_achievements.length
      medal_percentage_number = (medal_count / 289) * 100
      medal_percentage = medal_percentage_number.toFixed(2)
      hpp = user.statistics.total_hits / user.statistics.play_count
      hpp_count = hpp.toFixed(1)


      //join date
      const dateString = user.join_date
      const date = new Date(dateString)
      //current time
      const currenttime = new Date()
      const timedifference = currenttime - date
      //convert the time difference to months
      const months = Math.floor(timedifference / (1000 * 60 * 60 * 24 * 30))
      const user_joined = months / 12
      const user_joined_ago = user_joined.toFixed(1)
      //joindate
      const options = {
        hour: "2-digit",
        minute: "2-digit",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }
      const formattedDate = date.toLocaleDateString("en-US", options)

      let playstyles = ""

      try {
        const first = user.playstyle[0]
        const playstyle1 =
          first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
        playstyles += `${playstyle1} `
      } catch (err) { }

      try {
        const second = user.playstyle[1]
        const playstyle2 =
          second.charAt(0).toUpperCase() + second.slice(1).toLowerCase()
        playstyles += `${playstyle2} `
      } catch (err) { }

      try {
        const third = user.playstyle[2]
        const playstyle3 =
          third.charAt(0).toUpperCase() + third.slice(1).toLowerCase()
        playstyles += `${playstyle3} `
      } catch (err) { }

      try {
        const fourth = user.playstyle[3]
        const playstyle4 =
          fourth.charAt(0).toUpperCase() + fourth.slice(1).toLowerCase()
        playstyles += `${playstyle4} `
      } catch (err) { }

      if (playstyles.length === 0) {
        playstyles = "NaN"
      }

      playstyles = playstyles.trim()

      let posts = user.post_count
      if (posts == undefined) posts = "0"

      let comments = user.comments_count
      if (comments == undefined) comments = "0"

      const number_1s = user.scores_first_count

      const totalScore = user.statistics.total_score.toLocaleString()
      const rankedScore = user.statistics.ranked_score.toLocaleString()

      //embed
      const embed = new EmbedBuilder()
        .setColor("Purple")
        .setAuthor({
          name: `${user.username}: ${pp}pp (#${global_rank} ${user.country.code}#${country_rank})`,
          iconURL: `https://osuflags.omkserver.nl/${user.country_code}-256.png`,
          url: `https://osu.ppy.sh/u/${user.id}/${mode}`,
        })
        .setThumbnail(user.avatar_url)
        .setDescription(`**Hits per play:** \`${hpp_count}\` • **Medals:** \`${medal_count}/289\` (\`${medal_percentage}%\`)\n**Replays watched:** \`${replays_watched}\` • **#1 Scores:** \`${number_1s}\`\n**Total score:** \`${totalScore}\`\n**Ranked Score:** \`${rankedScore}\`\n**Plays with:** \`${playstyles}\`\n**Posts:** \`${posts}\` • **Comments:** \`${comments}\``)
        .setImage(user.cover_url)
        .setFooter({
          text: `Joined osu! ${formattedDate} (${user_joined_ago} years ago)`,
        })

      return embed;

    }



    if (args.join(" ").includes("-d") || args.join(" ").includes("-details")) {

      const user = await v2.user.details(userargs, mode)


      try {
        if (user.id == undefined) throw new Error("The user doesn't exist")
      } catch (err) {
        message.reply(`**The user \`${userargs}\` doesn't exist**`)
        return
      }

      const UserData = await getUserSecondPage(user)

      message.channel.send({ embeds: [UserData.data], components: [button2] })

    } else {

      const user = await v2.user.details(userargs, mode)

      try {
        if (user.id == undefined) throw new Error("The user doesn't exist")
      } catch (err) {
        message.reply(`**The user \`${userargs}\` doesn't exist**`)
        return
      }

      const UserData = await getUserFirstPage(user)

      message.channel.send({ embeds: [UserData.data], components: [button] })

    }





    const collector = message.channel.createMessageComponentCollector({
      time: 1000 * 15,
    })

    try {
      collector.on("collect", async (i) => {
        try {
          if (i.user.id != message.author.id) {

          } else if (i.user.id != message.author.id) {

          }
          else if (i.user.id === message.author.id) {
            userargs = ''
            userargs = userData[message.author.id].temp_osu

            if (i.customId == "more") {

              const user = await v2.user.details(userargs, mode)

              try {
                if (user.id == undefined) throw new Error("The user doesn't exist")
              } catch (err) {
                message.reply(`**The user \`${userargs}\` doesn't exist**`)
                return
              }

              const userData = await getUserSecondPage(user)
              await i.update({ embeds: [userData.data], components: [button2] })


            }

            if (i.customId == "less") {

              const user = await v2.user.details(userargs, mode)

              try {
                if (user.id == undefined) throw new Error("The user doesn't exist")
              } catch (err) {
                message.reply(`**The user \`${userargs}\` doesn't exist**`)
                return
              }

              const userData = await getUserFirstPage(user)
              await i.update({ embeds: [userData.data], components: [button] })


            }
          }
        } catch (err) {
          console.log(err)
        }
      })
    } catch (err) { }
  })
}
exports.name = "osu"
exports.aliases = ["osu", "o"]
exports.description = ["Displays the stats of a user\n\n**Parameters:**\n`username` get the stats from a username\n`-(gamemode)` get the stats of a particular gamemode",]
exports.usage = [`osu JustinNF -taiko\nosu YoruNoKen -taiko\nosu mrekk`]
exports.category = ["osu"]
