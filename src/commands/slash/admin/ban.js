const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");

/**
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */

async function run(client, interaction, userID) {
  await interaction.deferReply();
  const targetUserID = interaction.options.getString("id");
  const banReason = interaction.options.getString("reason") || "No reason provided.";

  const targetUser = await interaction.guild.members.fetch(targetUserID);
  if (!targetUser) {
    interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Unsuccessful!").setColor("Red").setDescription(`That user doesn't exist in the server.`)] });
    return;
  }

  if (targetUserID === interaction.guild.ownerId) {
    interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Unsuccessful!").setColor("Red").setDescription(`The person you are trying to ban in the owner of the server.`)] });
    return;
  }

  const userRole = targetUser.roles.highest.position;
  const requesterRole = interaction.member.roles.highest.position;
  const botRole = interaction.guild.members.me.roles.highest.position;

  if (userRole >= requesterRole) {
    interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Unsuccessful!").setColor("Red").setDescription(`The user you are trying to ban has a role higher/same than you.`)] });
    return;
  }

  if (userRole >= botRole) {
    interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Unsuccessful!").setColor("Red").setDescription(`I cannot comply with you request as the person you are trying to ban has a role higher/same than me.`)] });
    return;
  }

  const banList = Array.from(await interaction.guild.bans.fetch());
  const result = banList.find((arr) => arr[0] === userID);
  if (result) {
    interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Unsuccessful!").setColor("Red").setDescription(`The user with the ID \`${userID}\` is already banned from the server.`)] });
    return;
  }

  try {
    await targetUser.ban({ reason: banReason });
    interaction.editReply({
      embeds: [new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription(`Banned ${ban.username} from the server.\n**Reason:** ${banReason}`)],
    });
  } catch (e) {
    interaction.editReply(`There was an error while banning this user: ${e}`);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user.")
    .addStringOption((option) => option.setName("id").setDescription("ID of the user you want to Ban.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason you want to ban this user."))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  run: async (client, interaction) => {
    await run(client, interaction);
  },
};
