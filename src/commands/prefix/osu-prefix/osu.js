const { buildUserEmbed } = require("../../../command-embeds/osuEmbed");
const { getUsername } = require("../../../utils/getUsernamePrefix");
const { EmbedBuilder } = require("discord.js");

async function run(message, username, mode) {
  await message.channel.sendTyping();

  const now = Date.now();
  const user = await getUser(username, mode);
  if (user.error === null) {
    message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const embed = buildUserEmbed(user, mode);
  console.log(`Finished command in ${Date.now() - now}ms`);
  message.channel.send({ embeds: [embed] });
}

async function getUser(username, mode) {
  const url = `https://osu.ppy.sh/api/v2/users/${username}/${mode}`;
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
  name: "osu",
  aliases: ["osu", "profile"],
  cooldown: 5000,
  run: async (client, message, args, prefix, db) => {
    const collection = db.collection("user_data");

    const username = await getUsername(message, args, collection);
    if (!username) return;

    const wanted = ["-osu", "-mania", "-taiko", "-fruits"];
    const modes = wanted.filter((word) => args.indexOf(word) >= 0).map((word) => word.replace("-", ""));
    const mode = modes[0] ?? "osu";

    await run(message, username, mode);
  },
};
