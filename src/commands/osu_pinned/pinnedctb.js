const fs = require("fs");
const { v2, auth } = require("osu-api-extended")

// importing GetPinned
const { GetPinned } = require('../../exports/pinned_export')

exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  fs.readFile("./user-data.json", async (error, data) => {
    if (error) {
      console.log(error)
      return
    }

    const userData = JSON.parse(data)
    let userargs
    let mode = "fruits"
    let RuleSetId = 2
    let value = 0
    let PageNum = 1;

    if (message.mentions.users.size > 0) {
      const mentionedUser = message.mentions.users.first()
      try {
        if (mentionedUser) {
          if (message.content.includes(`<@${mentionedUser.id}>`)) {
            userargs = userData[mentionedUser.id].osuUsername
          } else {
            userargs = userData[message.author.id].osuUsername
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

        if (args.includes("-i")) {
          const iIndex = args.indexOf("-i")
          value = args[iIndex + 1] - 1
        }
        if (args.includes("-p")) {
          const iIndex = args.indexOf("-p")
          PageNum = args[iIndex + 1]
        }

        if (
          args.join(" ").startsWith("-i") ||
          args.join(" ").startsWith("-p")
        ) {
          try {
            userargs = userData[message.author.id].osuUsername
          } catch (err) {
            message.reply(
              `Set your osu! username by using "${prefix}link **your username**"`
            )
          }
        }
      }
    }

    if (userargs.length === 0) {
      try {
        userargs = userData[message.author.id].osuUsername
      } catch (err) {
        message.reply(
          `Set your osu! username by using "${prefix}link **your username**"`
        )
      }
    }

    //log in
    await auth.login(process.env.client_id, process.env.client_secret)
    const user = await v2.user.details(userargs, mode)
    if (user.id === undefined) {
      message.channel.send(`**The player \`${userargs}\` does not exist**`)
      return
    }

    const getPinned = await GetPinned(value, user, mode, RuleSetId, PageNum)

    message.channel.send({ content: `**I found \`${getPinned.total_pinned}\` pinned plays for ${user.username}**`, embeds: [getPinned.embed] })

  })
}
exports.name = "pinnedmania"
exports.aliases = ["pinnedctb", "pctb", "pc"]
exports.description = ["Shows a player's pinned plays."]
exports.usage = ["pinned Whitecat"]
exports.category = ["osu"]
