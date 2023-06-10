const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { query } = require("../../../utils/getQuery.js");
const { v2 } = require("osu-api-extended");

async function run(interaction, username) {
  await interaction.deferReply();
  const user = await v2.user.details(username);

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

  const avatar_url = `https://a.ppy.sh/${user.id}?1683992429.jpeg`;
  const embed = new EmbedBuilder().setColor("Green").setTitle(`Account linking successful`).setDescription(`Linked Discord account <@${interaction.user.id}>\nto \`${user.username}\``).setThumbnail(avatar_url);
  await interaction.editReply({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your osu! account to the bot")
    .addStringOption((option) => option.setName("username").setDescription("Your osu!bancho username").setRequired(true)),
  run: async ({ interaction }) => {
    const username = interaction.options.getString("username");
    await run(interaction, username);
  },
};
