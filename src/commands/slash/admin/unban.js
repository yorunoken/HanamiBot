const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");

/**
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */

async function run(client, interaction, userID) {
  const banList = Array.from(await interaction.guild.bans.fetch());
  const result = banList.find((arr) => arr[0] === userID);
  if (!result) {
    interaction.reply({ embeds: [new EmbedBuilder().setTitle("Unsuccessful!").setColor("Red").setDescription(`The user with the ID \`${userID}\` is not banned from the server!`)] });
    return;
  }

  await interaction.guild.bans.remove(userID);
  interaction.reply({ embeds: [new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription(`The user with the ID \`${userID}\` has been banned from the server.\n`)] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user.")
    .addStringOption((option) => option.setName("id").setDescription("ID of the user you want to unban.").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  run: async (client, interaction) => {
    const userID = interaction.options.getString("id");
    await run(client, interaction, userID);
  },
};
