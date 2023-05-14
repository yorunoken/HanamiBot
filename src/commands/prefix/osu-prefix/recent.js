const { buildRecentsEmbed } = require("../../../command-embeds/recentEmbed");
const { EmbedBuilder } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernamePrefix");

async function run(message, username, mode, db, i) {
  await message.channel.sendTyping();

  const index = i ?? 1;
  const pass = false;

  const user = await getUser(username, mode);
  if (user.error === null) {
    message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const recents = await getRecents(user, mode, pass);
  if (recents.length === 0) {
    message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No recent plays found for ${user.username}.`)] });
    return;
  }

  const embed = await buildRecentsEmbed(recents, user, mode, index - 1, db);
  message.channel.send({ content: "", embeds: [embed.embed] });
}

async function getRecents(user, mode, passes) {
  let includes = passes;
  switch (passes) {
    case passes === true:
      includes = 0;
    default:
      includes = 1;
  }
  const url = `https://osu.ppy.sh/api/v2/users/${user.id}/scores/recent?mode=${mode}&limit=50&include_fails=${includes}`;
  const headers = {
    Authorization: `Bearer ${process.env.osu_bearer_key}`,
  };
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  return await response.json();
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
  name: "recent",
  aliases: ["rs", "recent", "r"],
  cooldown: 5000,
  run: async (client, message, args, prefix, db, index) => {
    const collection = db.collection("user_data");

    const username = await getUsername(message, args, collection);
    if (!username) return;

    wanted = ["-osu", "-mania", "-taiko", "-fruits"];
    const modes = wanted.filter((word) => args.indexOf(word) >= 0).map((word) => word.replace("-", ""));
    const mode = modes[0] ?? "osu";

    // wanted = ["-pass", "-ps", "-passes"];
    // const passes = wanted.filter((word) => args.indexOf(word) >= 0)
    // const pass = passes[0] ?? false;

    await run(message, username, mode, db, index);
  },
};
