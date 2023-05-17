const { buildTopsEmbed } = require("../../../command-embeds/topEmbed");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernamePrefix");

async function run(message, username, mode, options, db, i) {
  await message.channel.sendTyping();

  const index = i ?? undefined;
  const page = options.page ?? options.p ?? 1;
  const reverse = false;
  const recent = true;

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

  const _ = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  const _b = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  let _row = new ActionRowBuilder().addComponents(_b, _);

  const nextPage = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);
  const prevPage = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
  let row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));

  if (page === 1) {
    if (tops.length > 5) {
      row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
    }
  } else if (tops.length <= 5) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));
  } else if (page === Math.ceil(tops.length / 5)) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
  } else {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
  }

  const embed = await buildTopsEmbed(tops, user, page, mode, index, reverse, recent, db);
  const response = await message.channel.send({ embeds: [embed], components: [row] });

  const filter = (i) => i.user.id === message.author.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    try {
      if (i.customId == "next") {
        if (!(page + 1 > Math.ceil(tops.length / 5))) {
          page++;
          if (page === Math.ceil(tops.length / 5)) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const embed = await buildTopsEmbed(tops, user, page, mode, index, reverse, recent, db);
        await response.edit({ embeds: [embed], components: [row] });
      } else if (i.customId == "prev") {
        if (!(page <= 1)) {
          page--;
          if (page === 1) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const embed = await buildTopsEmbed(tops, user, page, mode, index, reverse, recent, db);
        await response.edit({ embeds: [embed], components: [row] });
      }
    } catch (e) {
      console.error(e);
    }
  });

  collector.on("end", async (i) => {
    await response.edit({ components: [] });
  });
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
  name: "recentbest",
  aliases: ["rb", "recentbest"],
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
