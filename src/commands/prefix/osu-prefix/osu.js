const { buildUserEmbed } = require("../../../command-embeds/osuEmbed");
const { getUsername } = require("../../../utils/getUsernamePrefix");
const { EmbedBuilder } = require("discord.js");
const { v2 } = require("osu-api-extended");

async function run(message, username, mode) {
  await message.channel.sendTyping();

  const user = await v2.user.details(username, mode);
  if (user.error === null) {
    message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const embed = buildUserEmbed(user, mode);
  message.channel.send({ embeds: [embed] });
}

module.exports = {
  name: "osu",
  aliases: ["osu", "profile"],
  cooldown: 5000,
  run: async ({ message, args }) => {
    const username = await getUsername(message, args);
    if (!username) return;

    const wanted = ["-osu", "-mania", "-taiko", "-fruits"];
    const modes = wanted.filter((word) => args.indexOf(word) >= 0).map((word) => word.replace("-", ""));
    const mode = modes[0] ?? "osu";

    await run(message, username, mode);
  },
};
