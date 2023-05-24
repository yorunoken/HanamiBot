const { SlashCommandBuilder, ChannelType, Client, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

/**
 *
 * @param {Client} client
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(client, interaction, db) {
  await interaction.deferReply();
  const collection = db.collection("server_config");

  const channel = interaction.options.getChannel("channel");
  const permBoolean = channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages && PermissionFlagsBits.ViewChannel);
  if (!permBoolean) {
    interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Error!").setColor("Red").setDescription("I don't have permission to read/write in that channel.")] });
    return;
  }

  await collection.updateOne({ _id: interaction.guildId }, { $set: { pinChannel: channel.id } }, { upsert: true });
  const embed = new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription(`The pin channel has been set to <#${channel.id}>`);
  interaction.editReply({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pin")
    .setDescription("pin configs")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName("channel").setDescription("Choose a text channel I can send the messages to.").addChannelTypes(ChannelType.GuildText)),
  run: async ({ client, interaction, db }) => {
    await run(client, interaction, db);
  },
};
