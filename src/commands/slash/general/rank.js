const { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } = require("discord.js");
const fs = require("fs");

/**
 *
 * @param {Client} client
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(client, interaction, user) {
  await interaction.deferReply();
  if (user.bot) {
    const embed = new EmbedBuilder().setColor("Purple").setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`).setTitle(`${user.tag}'s Level`).setDescription(`Bots can't have levels.`);
    interaction.followUp({ embeds: [embed] });
    return;
  }
  const config = JSON.parse(await fs.promises.readFile("./serversConfig.json"));
  if (config[interaction.guildId]?.levels === false) {
    interaction.followUp("This server has the levels feature turned off.\nAdministrators can re-enable it by using </server config level:1101637084869050378>");
    return;
  }

  const levels = JSON.parse(await fs.promises.readFile("./pointsServer.json"));
  const thisServer = levels[interaction.guildId];
  const leaderboard = Object.entries(thisServer).sort(([, a], [, b]) => b.experience - a.experience);

  const _user = thisServer[user.id];
  const userRank = leaderboard.findIndex((uy) => uy[0] === user.id);
  if (userRank === -1) {
    const embed = new EmbedBuilder().setColor("Purple").setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`).setTitle(`${user.tag}'s Level`).setDescription(`This user hasn't sent a message in this server yet.`);
    interaction.followUp({ embeds: [embed] });
    return;
  }

  const xp = _user.experience.toFixed(2) ?? "0";
  const lvl = _user.level ?? "0";

  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`)
    .setTitle(`${user.tag}'s Level`)
    .setDescription(`**Rank:** \`#${userRank + 1}\`\n**Experience:** \`${xp}\`\n**Level:** \`${lvl}\``);
  interaction.followUp({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check out what level you are")
    .addUserOption((option) => option.setName("user").setDescription("@ a target user to get their level")),
  run: async (client, interaction) => {
    const user = interaction.options.getUser("user") ?? interaction.user;
    await run(client, interaction, user);
  },
};
