const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(interaction) {
  const user = interaction.options.getUser("user") ?? interaction.user;
  const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`;
  const embed = new EmbedBuilder().setAuthor({ name: `Avatar of ${user.username}#${user.discriminator}`, url: avatarURL }).setImage(avatarURL);
  interaction.editReply({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Get someone's Discord avatar.")
    .addUserOption((o) => o.setName("user").setDescription("Get someone's Discord avatar.")),
  run: async ({ interaction }) => {
    await interaction.deferReply();
    await run(interaction);
  },
};
