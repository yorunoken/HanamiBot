const { buildRecentsEmbed } = require("../../../command-embeds/recentEmbed");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernamePrefix");
const { query } = require("../../../utils/getQuery.js");
const { v2, mods } = require("osu-api-extended");

async function run(message, username, mode, i, args, pass) {
  await message.channel.sendTyping();

  let index = i ?? 1;

  let argValues = {};
  for (const arg of args) {
    const [key, value] = arg.split("=");
    if (key && value) {
      argValues[key.toLowerCase()] = Number(value) || value.toLowerCase();
    }
  }
  if (args.join("").includes("+")) {
    const index = args.indexOf("+") + 1;
    var mods = args[index]?.slice(1);
    argValues["mods"] = mods;
  }

  let modsRaw = argValues["mods"];
  const modID = modsRaw ? mods.id(modsRaw) : undefined;

  const user = await v2.user.details(username, mode);
  if (user.error === null) {
    message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const recents = await v2.scores.user.category(user.id, "recent", { include_fails: pass, limit: 100, mode: mode, mods: modID });
  if (recents.length === 0) {
    message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No recent plays found for ${user.username} in osu!${mode === "osu" ? "standard" : mode}.`)] });
    return;
  }

  const _ = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  const _b = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  let _row = new ActionRowBuilder().addComponents(_b, _);

  const nextPage = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);
  const prevPage = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
  let row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));

  if (index === 1) {
    if (recents.length > 1) {
      row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
    }
  } else if (recents.length <= 1) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));
  } else if (index === recents.length) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
  } else {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
  }

  const tops = await get100thPlay(user, mode, recents[index - 1]);
  const embed = await buildRecentsEmbed(recents, user, mode, index - 1, tops);
  const response = await message.channel.send({ embeds: [embed.embed], components: [row] });

  const filter = (i) => i.user.id === message.author.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    try {
      if (i.customId == "next") {
        if (index + 1 <= recents.length) {
          index++;
          if (index === recents.length) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const tops = await get100thPlay(user, mode, recents[index - 1]);
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1, tops);
        response.edit({ embeds: [embed.embed], components: [row] });
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
        const tops = await get100thPlay(user, mode, recents[index - 1]);
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1, tops);
        response.edit({ embeds: [embed.embed], components: [row] });
      }
    } catch (e) {}
  });

  collector.on("end", async (i) => {
    try {
      await response.edit({ components: [] });
    } catch (e) {}
  });
}

async function get100thPlay(user, mode, recent) {
  var doc = await query({ query: `SELECT * FROM osuUser WHERE id = ?`, parameters: [user.id], name: "value", type: "get" });
  if (!doc) {
    var tops = await v2.scores.user.category(user.id, "best", { mode: mode, limit: 100 });
    await query({ query: `INSERT INTO osuUser (id, value) VALUES (?, json_object('pp100', ?))`, parameters: [user.id, tops[tops.length - 1].pp], type: "run" });
    var doc = await query({ query: `SELECT value FROM osuUser WHERE id = ${user.id}`, name: "value", type: "get" });
  }
  const top100 = doc?.pp100;
  if (recent.pp < top100) {
    return "";
  }
  if (!recent.pp) {
    return "";
  }
  if (!tops) {
    var tops = await v2.scores.user.category(user.id, "best", { mode: mode, limit: 100 });
  }
  const newValue = recent.pp;
  const index = getIndex(tops, newValue);

  return recent.beatmap.status === "ranked" ? `Personal Best #${index}` : `Personal Best #${index} (if ranked)`;
}

function getIndex(tops, value) {
  let insertIndex = 1;
  for (const element of tops) {
    const pp = element.pp;
    if (pp <= value) {
      break;
    }
    insertIndex++;
  }
  return insertIndex;
}

module.exports = {
  name: "recent",
  aliases: ["rs", "recent", "r", "rt", "recenttaiko", "rc", "recentfruits", "rctb", "recentctb", "rm", "recentmania", "rsp", "recentpass", "rp", "rtp", "recenttaikopass", "rcp", "recentfruitspass", "rctbp", "recentctbpass", "rmp", "recentmaniapass"],
  cooldown: 5000,
  run: async ({ message, args, index, commandName }) => {
    const username = await getUsername(message, args);
    if (!username) return;

    let mode = "osu";
    switch (commandName) {
      case "rt":
      case "recenttaiko":
        mode = "taiko";
        break;
      case "rc":
      case "recentfruits":
      case "rctb":
      case "recentctb":
        mode = "fruits";
        break;
      case "rm":
      case "recentmania":
        mode = "mania";
        break;
    }

    let pass = true;
    if (commandName.includes("p")) {
      pass = false;
    }

    // wanted = ["-pass", "-ps", "-passes"];
    // const passes = wanted.filter((word) => args.indexOf(word) >= 0)
    // const pass = passes[0] ?? false;

    await run(message, username, mode, index, args, pass);
  },
};
