const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

async function run(interaction, db) {
  await interaction.deferReply();
  const collection = db.collection("server_prefixes");

  const currentPrefix = await collection.findOne({ [`${interaction.guildId}`]: { $exists: true } });
  let oldPrefix = "NONE";
  if (currentPrefix) {
    oldPrefix = currentPrefix[interaction.guildId];
  }

  const newPrefix = interaction.options.getString("prefix");

  const update = { $set: { [`${interaction.guildId}`]: newPrefix } };
  const options = { upsert: true };

  await collection.updateOne({}, update, options);

  const embed = new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription(`The server prefix has been changed from \`${oldPrefix}\` to \`${newPrefix}\``);
  interaction.editReply({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Set the prefix of a server.")
    .addStringOption((option) => option.setName("prefix").setDescription("Your new prefix").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  run: async (client, interaction, db) => {
    await run(interaction, db);
  },
};
