const { ContextMenuCommandBuilder, ApplicationCommandType, Client, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");

/**
 *
 * @param {Client} client
 * @param {ChatInputCommandInteraction} interaction
 */
async function run(client, interaction, db) {
  await interaction.deferReply();
  const collection = db.collection("server_config");
  const document = await collection.findOne({ _id: interaction.guildId });
  const channelPin = document?.pinChannel;

  try {
    var channel = await client.channels.fetch(channelPin);
  } catch (e) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Red").setTitle("Error!").setDescription("I don't have permissions to view this channel!")] });
    return;
  }
  if (!channelPin) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Red").setTitle("Error!").setDescription("There isn't a channel set for pinning messages! Users with `ManageGuild` permission can set it by using `/pin channel`")] });
    return;
  }

  const messageId = interaction.targetId;
  const message = await interaction.channel.messages.fetch(messageId);
  const user = message.author;

  let embeds = [];
  if (message.embeds && message.content.trim() === "") {
    if (!message.embeds[0]) {
      embeds.push(
        new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: user.avatarURL({ size: 128 }) })
          .setColor("Random")
          .setURL("https://yoru.com.tr")
          .addFields({ name: "Source", value: `[Go to message](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${messageId})` })
      );
    } else {
      embeds.push(
        new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: user.avatarURL({ size: 128 }) })
          .setColor("Random")
          .setURL("https://yoru.com.tr")
          .addFields({ name: "Source", value: `[Go to message](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${messageId})` }),
        message.embeds[0]
      );
    }
  } else {
    embeds.push(
      new EmbedBuilder()
        .setColor("Random")
        .setURL("https://yoru.com.tr")
        .setAuthor({ name: user.tag, iconURL: user.avatarURL({ size: 128 }) })
        .setDescription(message.content.trim().length > 0 ? message.content : "\u200B")
        .addFields({ name: "Source", value: `[Go to message](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${messageId})` })
    );
  }

  if (message.attachments) {
    message.attachments.map((x) => {
      embeds.push(new EmbedBuilder().setURL("https://yoru.com.tr").setImage(x.url));
    });
  }
  console.log(embeds);

  channel.send({ embeds: embeds });
  interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`<@${interaction.user.id}> pinned [a message](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${messageId})`)] });
}

module.exports = {
  data: new ContextMenuCommandBuilder().setName("Pin a message").setType(ApplicationCommandType.Message),
  run: async (client, interaction, db) => {
    await run(client, interaction, db);
  },
};
