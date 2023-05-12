const { SlashCommandBuilder } = require("@discordjs/builders");
const { buildUserEmbed } = require("../../../command-embeds/osuEmbed");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { EmbedBuilder } = require("discord.js");

async function run(interaction, username, mode) {
  await interaction.deferReply();

  const user = await getUser(username, mode);
  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const embed = buildUserEmbed(user, mode);
  interaction.editReply({ embeds: [embed] });
}

async function getUser(username, mode) {
  const now = Date.now();
  const url = `https://osu.ppy.sh/api/v2/users/${username}/${mode}`;
  const headers = {
    Authorization: `Bearer ${process.env.osu_bearer_key}`,
  };
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  console.log(`Got user in ${Date.now() - now}ms`);
  return await response.json();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("osu")
    .setDescription("Displays a user's osu! stats specified by mode")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)").setRequired(false))
    .addStringOption((option) =>
      option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "fruits", value: "fruits" })
    ),
  run: async (client, interaction, db) => {
    const mode = interaction.options.getString("mode") ?? "osu";

    const collection = db.collection("user_data");
    const username = await getUsername(interaction, collection);
    if (!username) return;

    await run(interaction, username, mode);
  },
};
