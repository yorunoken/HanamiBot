const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { buildUserEmbed } = require("../../../command-embeds/osuEmbed");

async function run(interaction, username, db) {
  await interaction.deferReply();
  const user = await fetchUser(username);

  const collection = db.collection("user_data");
  const filter = {};
  const update = { $set: { [`users.${interaction.user.id}.BanchoUserId`]: `${user.id}` } };
  const options = { upsert: true };

  await collection.updateOne(filter, update, options);

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
