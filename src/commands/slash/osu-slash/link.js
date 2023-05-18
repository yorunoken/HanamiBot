const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { buildUserEmbed } = require("../../../command-embeds/osuEmbed");

async function run(interaction, username, collection) {
  await interaction.deferReply();
  const user = await fetchUser(username);

  await collection.updateOne({ _id: interaction.user.id }, { $set: { BanchoUserId: user.id } }, { upsert: true });

  const avatar_url = `https://a.ppy.sh/${user.id}?1683992429.jpeg`;
  const embed = new EmbedBuilder().setColor("Green").setTitle(`Account linking successful`).setDescription(`Linked Discord account <@${interaction.user.id}>\nto \`${user.username}\``).setThumbnail(avatar_url);
  await interaction.editReply({ embeds: [embed] });
}

async function fetchUser(username) {
  const url = `https://osu.ppy.sh/api/v2/users/${username}/osu`;
  const headers = {
    Authorization: `Bearer ${process.env.osu_bearer_key}`,
  };
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  return await response.json();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your osu! account to the bot")
    .addStringOption((option) => option.setName("username").setDescription("Your minecraft username").setRequired(true)),
  run: async (client, interaction, db) => {
    const username = interaction.options.getString("username");

    const collection = db.collection("user_data");
    await run(interaction, username, collection);
  },
};
