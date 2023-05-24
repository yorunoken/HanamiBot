const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { query } = require("../../../utils/getQuery.js");

async function run(interaction, username) {
  await interaction.deferReply();
  const user = await fetchUser(username);

  const now = Date.now();
  const qUser = await query({ query: `SELECT * FROM users WHERE id = ?`, parameters: [interaction.user.id], name: "value", type: "get" });
  if (!qUser) {
    await query({ query: `INSERT INTO users (id, value) VALUES (?, json_object('BanchoUserId', ?))`, parameters: [interaction.user.id, user.id], type: "run" });
  } else {
    const q = `UPDATE users
    SET value = json_set(value, '$.BanchoUserId', ?)
    WHERE id = ?`;
    await query({ query: q, parameters: [user.id, interaction.user.id], type: "run" });
  }
  console.log(`took ${Date.now() - now}ms`);
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
  run: async ({ interaction }) => {
    await run(interaction, username);
  },
};
