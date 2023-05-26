const { leaderboard } = require("../../../command-embeds/leaderboardEmbed.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { query } = require("../../../utils/getQuery.js");
const axios = require("axios");
const { v2 } = require("osu-api-extended");

async function run(message, client, args, name, options) {
  await message.channel.sendTyping();

  let page = options.page ?? options.p ?? 1;
  let argValues = {};
  for (const arg of args) {
    const [key, value] = arg.split("=");
    if (key && value) {
      argValues[key.toLowerCase()] = Number(value) || value.toLowerCase();
    }
  }

  const requester = await query({ query: `SELECT value FROM users WHERE id = '${message.author.id}'`, type: "get", name: "value" });
  const requesterBancho = requester?.BanchoUserId;

  let modsRaw = argValues["mods"];
  let modifiedMods = "";
  if (modsRaw) {
    modsRaw = modsRaw.toUpperCase();
    const modsArr = modsRaw.match(/.{1,2}/g);
    modifiedMods = modsArr?.map((mod) => `&mods[]=${mod}`).join("");
  }

  let beatmapID;
  const regex = /\/osu\.ppy\.sh\/(b|beatmaps|beatmapsets)\/\d+/;
  if (message.reference) {
    beatmapID = await getEmbedFromReply(message, client);

    if (!beatmapID) {
      message.channel.send("The replied embed doesn't have a beatmap ID.");
      return;
    }
  } else if (regex.test(args[0])) {
    beatmapID = args[0].match(/\d+$/)[0];
  } else {
    beatmapID = await cycleThroughEmbeds(client, message);
    if (!beatmapID) {
      message.channel.send("No embeds found in the last 100 messages.");
      return;
    }
  }

  const beatmap = await v2.beatmap.id.details(beatmapID);
  if (beatmap.status != "ranked" && beatmap.status != "loved" && beatmap.status != "approved") {
    message.channel.send("It seems like that map doesn't have a leaderboard..");
  }

  const url = new URL(`https://osu.ppy.sh/beatmaps/${beatmapID}/scores?mode=${beatmap.mode}&type=${name}${modifiedMods}`);
  const res = await axios.get(url, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } });
  const scores = res.data;

  const _ = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  const _b = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  let _row = new ActionRowBuilder().addComponents(_b, _);

  const nextPage = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);
  const prevPage = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
  let row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));

  if (page === 1) {
    if (scores.scores.length > 5) {
      row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
    }
  } else if (scores.scores.length <= 5) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));
  } else if (page === Math.ceil(scores.scores.length / 5)) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
  } else {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
  }

  const embed = await leaderboard(beatmapID, scores, page, beatmap, requesterBancho, message.author);
  const response = await message.channel.send({ embeds: [embed], components: [row] });

  const filter = (i) => i.user.id === message.author.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    const score = scores.scores;
    try {
      if (i.customId == "next") {
        if (!(page + 1 >= Math.ceil(score.length / 5))) {
          page++;
          if (page === Math.ceil(score.length / 5)) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        const embed = await leaderboard(beatmapID, scores, page, beatmap, requesterBancho, message.author);
        await i.update({ embeds: [embed], components: [row] });
      } else if (i.customId == "prev") {
        if (!(page <= 1)) {
          page--;
          if (page === 1) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        const embed = await leaderboard(beatmapID, scores, page, beatmap, requesterBancho, message.author);
        await i.update({ embeds: [embed], components: [row] });
      }
    } catch (e) {
      console.error(e);
    }
  });

  collector.on("end", async (i) => {
    try {
      await response.edit({ components: [] });
    } catch (e) {}
  });
}

async function getEmbedFromReply(message, client) {
  const guild = await client.guilds.fetch(message.reference.guildId);
  const channel = guild.channels.cache.get(message.reference.channelId);
  const messageRaw = await channel.messages.fetch(message.reference.messageId);

  const beatmapID = findID(messageRaw.embeds[0]);
  if (!beatmapID) {
    return false;
  }
  return beatmapID;
}

function findID(embed) {
  const regex = /^https?:\/\/osu\.ppy\.sh\/(b|beatmaps)\/\d+$/;
  let beatmapIDFound = false;

  let beatmapID;
  if (embed.url) {
    if (regex.test(embed.url)) {
      beatmapID = embed.url.match(/\d+/)[0];
      if (beatmapID !== undefined) {
        beatmapIDFound = true;
      }
    }
  }

  if (beatmapIDFound === false && embed.description) {
    if (regex.test(embed.description)) {
      beatmapID = embed.description.match(/\d+/)[0];
      if (beatmapID !== undefined) {
        beatmapIDFound = true;
      }
    }
  }

  if (beatmapIDFound === false && embed.author?.url) {
    if (regex.test(embed.author?.url)) {
      beatmapID = embed.author?.url.match(/\d+/)[0];
      if (beatmapID !== undefined) {
        beatmapIDFound = true;
      }
    }
  }

  if (!beatmapIDFound) {
    return false;
  }
  return beatmapID;
}

async function cycleThroughEmbeds(client, message) {
  const channel = client.channels.cache.get(message.channel.id);
  const messages = await channel.messages.fetch({ limit: 100 });

  for (const [id, message] of messages) {
    if (message.embeds.length > 0 && message.author.bot) {
      const embed = message.embeds[0];
      beatmapID = await findID(embed);
      if (beatmapID) {
        break;
      }
    }
  }
  return beatmapID;
}

module.exports = {
  name: "lb",
  aliases: ["ct", "lb"],
  cooldown: 5000,
  run: async ({ client, message, args, commandName }) => {
    const name = commandName === "ct" ? "country" : "global";
    wanted = ["-p", "-page"];
    let options = [];
    wanted.forEach((word) => {
      if (args.includes(word)) {
        const key = word.replace("-", "");
        const value = args[args.indexOf(word) + 1];
        options[key] = value;
      }
    });

    await run(message, client, args, name, options);
  },
};
