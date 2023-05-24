const { SlashCommandBuilder } = require("@discordjs/builders");
const { buildUserEmbed } = require("../../../command-embeds/osuEmbed");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { EmbedBuilder } = require("discord.js");
const { v2 } = require("osu-api-extended");

async function run(interaction, username, mode) {
  await interaction.deferReply();

  const user = await v2.user.details(username, mode);
  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const embed = buildUserEmbed(user, mode);
  interaction.editReply({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("osu")
    .setDescription("Displays a user's osu! stats specified by mode")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)").setRequired(false))
    .addStringOption((option) =>
      option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "fruits", value: "fruits" })
    ),
  run: async ({ interaction }) => {
    const mode = interaction.options.getString("mode") ?? "osu";
    const username = await getUsername(interaction);
    if (!username) return;

    await run(interaction, username, mode);
  },
};
