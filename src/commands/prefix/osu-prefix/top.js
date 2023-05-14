const { buildTopsEmbed } = require("../../../command-embeds/topEmbed");
const { EmbedBuilder } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernamePrefix");

async function run(message, username, mode, options, db, i) {
  await message.channel.sendTyping();

  const index = i ?? undefined;
  const page = options.page ?? options.p ?? 1;
  const recent = false;
  const reverse = false;

  const user = await getUser(username, mode);
  if (user.error === null) {
    message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const tops = await getTops(user, mode);
  if (tops.length === 0) {
    message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No plays found for ${user.username}.`)] });
    return;
  }

  const embed = await buildTopsEmbed(tops, user, page, mode, index, reverse, recent, db);
  message.channel.send({ embeds: [embed] });
}

async function getTops(user, mode) {
  const url = `https://osu.ppy.sh/api/v2/users/${user.id}/scores/best?mode=${mode}&limit=100`;
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
  name: "top",
  aliases: ["top", "t"],
  cooldown: 5000,
  run: async (client, message, args, prefix, db, index) => {
    const collection = db.collection("user_data");
    const username = await getUsername(message, args, collection);
    if (!username) return;

    wanted = ["-osu", "-mania", "-taiko", "-fruits"];
    const modes = wanted.filter((word) => args.indexOf(word) >= 0).map((word) => word.replace("-", ""));
    const mode = modes[0] ?? "osu";

    wanted = ["-p", "-page"];
    let options = [];
    wanted.forEach((word) => {
      if (args.includes(word)) {
        const key = word.replace("-", "");
        const value = args[args.indexOf(word) + 1];
        options[key] = value;
      }
    });

    await run(message, username, mode, options, db, index);
  },
};
