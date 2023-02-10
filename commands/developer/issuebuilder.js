const {Octokit} = require("octokit")
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js")

exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  if (message.author.id != "372343076578131968") {
    message.reply("**Only the developer can use this command.**")
    return
  }

  const octokit = new Octokit({
    auth: process.env.Github_Token,
  })

  let Title = args.join(" ")

  let labels = []

  user = message.author

  try {
    if (message.reference.messageId) {
      message.channel.messages
        .fetch(message.reference.messageId)
        .then(async (Content) => {
          let addedlabels = "None"
          const confirm = new EmbedBuilder()
            .setTitle("Issue builder v2")
            .setThumbnail(`${user.displayAvatarURL()}?size=1024`)
            .setDescription(
              `Preview of issue:\n\n**${Title}**\n${Content.content}`
            )
            .setFields({name: `Added labels:`, value: addedlabels})

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Bug")
              .setCustomId("bug")
              .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
              .setLabel("Suggestion")
              .setCustomId("suggestion")
              .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
              .setLabel("High priority")
              .setCustomId("priority")
              .setStyle(ButtonStyle.Secondary)
          )

          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("New command")
              .setCustomId("new")
              .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
              .setLabel("First issue")
              .setCustomId("first")
              .setStyle(ButtonStyle.Secondary)
          )

          const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Confirm")
              .setCustomId("confirm")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setLabel("Cancel")
              .setCustomId("cancel")
              .setStyle(ButtonStyle.Danger)
          )

          message.channel.send({
            embeds: [confirm],
            components: [row, row2, row3],
          })

          const collector = message.channel.createMessageComponentCollector()

          let addLabels = []

          try {
            collector.on("collect", async (i) => {
              try {
                if (i.user.id != "372343076578131968") return

                if (i.customId == "bug") {
                  console.log(addLabels)
                  addLabels.push("bug")
                  console.log(addLabels)

                  const confirm = new EmbedBuilder()
                    .setTitle("Issue builder v2")
                    .setThumbnail(`${user.displayAvatarURL()}?size=1024`)
                    .setDescription(
                      `Preview of issue:\n\n**${Title}**\n${Content.content}`
                    )
                    .setFields({
                      name: `Added labels:`,
                      value: addLabels.join(", "),
                    })

                  i.update({embeds: [confirm], components: [row, row2, row3]})
                }

                if (i.customId == "suggestion") {
                  console.log(addLabels)
                  addLabels.push("suggestion")
                  console.log(addLabels)

                  const confirm = new EmbedBuilder()
                    .setTitle("Issue builder v2")
                    .setThumbnail(`${user.displayAvatarURL()}?size=1024`)
                    .setDescription(
                      `Preview of issue:\n\n**${Title}**\n${Content.content}`
                    )
                    .setFields({
                      name: `Added labels:`,
                      value: addLabels.join(", "),
                    })

                  i.update({embeds: [confirm], components: [row, row2, row3]})
                }

                if (i.customId == "priority") {
                  console.log(addLabels)
                  addLabels.push("high priority")
                  console.log(addLabels)

                  const confirm = new EmbedBuilder()
                    .setTitle("Issue builder v2")
                    .setThumbnail(`${user.displayAvatarURL()}?size=1024`)
                    .setDescription(
                      `Preview of issue:\n\n**${Title}**\n${Content.content}`
                    )
                    .setFields({
                      name: `Added labels:`,
                      value: addLabels.join(", "),
                    })

                  i.update({embeds: [confirm], components: [row, row2, row3]})
                }

                if (i.customId == "new") {
                  console.log(addLabels)
                  addLabels.push("new command")
                  console.log(addLabels)

                  const confirm = new EmbedBuilder()
                    .setTitle("Issue builder v2")
                    .setThumbnail(`${user.displayAvatarURL()}?size=1024`)
                    .setDescription(
                      `Preview of issue:\n\n**${Title}**\n${Content.content}`
                    )
                    .setFields({
                      name: `Added labels:`,
                      value: addLabels.join(", "),
                    })

                  i.update({embeds: [confirm], components: [row, row2, row3]})
                }

                if (i.customId == "first") {
                  console.log(addLabels)
                  addLabels.push("good first issue")
                  console.log(addLabels)

                  const confirm = new EmbedBuilder()
                    .setTitle("Issue builder v2")
                    .setThumbnail(`${user.displayAvatarURL()}?size=1024`)
                    .setDescription(
                      `Preview of issue:\n\n**${Title}**\n${Content.content}`
                    )
                    .setFields({
                      name: `Added labels:`,
                      value: addLabels.join(", "),
                    })

                  i.update({embeds: [confirm], components: [row, row2, row3]})
                }

                if (i.customId == "cancel") {
                  console.log("hii")
                  i.update({
                    content: "Successfully canceled issue builder.",
                    embeds: [],
                    components: [],
                  })
                  return
                }

                if (i.customId == "confirm") {
                  const issuebuilder = await octokit.request(
                    "POST /repos/YoruNoKen/miaosu/issues",
                    {
                      owner: "YoruNoKen",
                      repo: "miaosu",
                      title: `${Title}`,
                      body: `> ${Content.content}\n\n[Original Message by @${Content.author.tag}](https://canary.discord.com/channels/${Content.guildId}/${Content.channelId}/${Content.id})`,
                      labels: addLabels,
                    }
                  )

                  const labelNames = issuebuilder.data.labels
                    .map((x) => x.name)
                    .join(", ")
                  const embed = new EmbedBuilder()
                    .setTitle("Issue builder v2")
                    .setColor("Purple")
                    .setDescription(
                      `Successfully created Issue #${issuebuilder.data.number}\n[Click here to go to issue](https://github.com/YoruNoKen/miaosu/issues/${issuebuilder.data.number})`
                    )
                    .setFields(
                      {name: `Added Labels:`, value: labelNames},
                      {name: `Assigned:`, value: `YoruNoKen`}
                    )

                  i.update({embeds: [embed], components: []})

                  addLabels = []
                }
              } catch (err) {
                console.log(err)
              }
            })
          } catch (err) {}
        })
    }
  } catch (err) {
    message.reply("**Please reply to a message.**")
    return
  }
}
exports.name = "issuebuilder"
exports.aliases = ["issuebuilder", "ib", "builder"]
exports.description = ["issue builder for github (developer only)"]
exports.usage = [`invite`]
exports.category = ["developer"]
