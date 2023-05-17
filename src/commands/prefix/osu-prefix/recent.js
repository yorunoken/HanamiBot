const { buildRecentsEmbed } = require("../../../command-embeds/recentEmbed");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernamePrefix");

async function run(message, username, mode, db, i) {
  await message.channel.sendTyping();

  let index = i ?? 1;
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

  const _ = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  const _b = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  let _row = new ActionRowBuilder().addComponents(_b, _);

  const nextPage = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);
  const prevPage = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
  let row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));

  if (index === 1) {
    if (recents.length > 5) {
      row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
    }
  } else if (recents.length <= 1) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));
  } else if (index === recents.length) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
  } else {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
  }

  const embed = await buildRecentsEmbed(recents, user, mode, index - 1, db);
  const response = await message.channel.send({ content: "", embeds: [embed.embed], components: [row] });

  const filter = (i) => i.user.id === message.author.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    try {
      if (i.customId == "next") {
        console.log(index, recents.length); // returns 2, 14
        if (index + 1 < recents.length) {
          index++;
          if (index === recents.length) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }
        console.log("done");

        await i.update({ components: [_row] });
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1, db);
        response.edit({ content: "", embeds: [embed.embed], components: [row] });
      } else if (i.customId == "prev") {
        if (!(index <= 1)) {
          index--;
          if (index === 1) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1, db);
        response.edit({ content: "", embeds: [embed.embed], components: [row] });
      }
    } catch (e) {}
  });

  collector.on("end", async (i) => {
    if (i.message !== undefined) {
      await response.edit({ components: [] });
    }
  });
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
