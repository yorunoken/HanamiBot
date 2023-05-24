const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

async function run(interaction, db) {
  await interaction.deferReply();
  const collection = db.collection("server_config");

  const document = await collection.findOne({ _id: interaction.guildId });
  let oldPrefix = "null";
  if (document?.prefix) {
    oldPrefix = document.prefix;
  }

  const newPrefix = interaction.options.getString("prefix");

  await collection.updateOne({ _id: interaction.guildId }, { $set: { prefix: newPrefix } }, { upsert: true });

  const embed = new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription(`The server prefix has been changed from \`${oldPrefix}\` to \`${newPrefix}\``);
  interaction.editReply({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Set the prefix of a server.")
    .addStringOption((option) => option.setName("prefix").setDescription("Your new prefix").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  run: async ({ interaction, db }) => {
    await run(interaction, db);
  },
};
