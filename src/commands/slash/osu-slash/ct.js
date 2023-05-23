const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");
const { leaderboard } = require("../../../command-embeds/leaderboardEmbed.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { query } = require("../../../utils/getQuery.js");
const axios = require("axios");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(client, interaction) {
  await interaction.deferReply();
  let page = interaction.options.getInteger("page") ?? 1;

  const requester = await query({ query: `SELECT value FROM users WHERE id = '${interaction.user.id}'`, type: "get", name: "value" });
  const requesterBancho = requester?.BanchoUserId;

  let modsRaw = interaction.options.getString("mods");
  let modifiedMods = "";
  if (modsRaw) {
    modsRaw = modsRaw.toUpperCase();
    const modsArr = modsRaw.match(/.{1,2}/g);
    modifiedMods = modsArr?.map((mod) => `&mods[]=${mod}`).join("");
  }

  let beatmapID = interaction.options.getString("link");
  if (beatmapID) {
    const regex = /\d+$/;
    beatmapID = beatmapID.match(regex)[0];
  } else {
    beatmapID = await cycleThroughEmbeds(client, interaction);
  }

  const beatmap = await getMap(beatmapID);
  if (beatmap.status != "ranked" && beatmap.status != "loved" && beatmap.status != "approved") {
    interaction.editReply("It seems like that map doesn't have a leaderboard..");
  }

  const url = new URL(`https://osu.ppy.sh/beatmaps/${beatmapID}/scores?mode=${beatmap.mode}&type=country${modifiedMods}`);
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

  const embed = await leaderboard(beatmapID, scores, page, beatmap, requesterBancho, interaction.user);
  const response = await interaction.editReply({ content: "", embeds: [embed], components: [row] });

  const filter = (i) => i.user.id === interaction.user.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    const score = scores.scores;
    try {
      if (i.customId == "next") {
        if (!(page + 1 > Math.ceil(score.length / 5))) {
          page++;
          if (page === Math.ceil(score.length / 5)) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const embed = await leaderboard(beatmapID, scores, page, beatmap, requesterBancho, interaction.user);
        await interaction.editReply({ content: "", embeds: [embed], components: [row] });
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
        const embed = await leaderboard(beatmapID, scores, page, beatmap, requesterBancho, interaction.user);
        await interaction.editReply({ embeds: [embed], components: [row] });
      }
    } catch (e) {
      console.error(e);
    }
  });

  collector.on("end", async (i) => {
    await interaction.editReply({ components: [] });
  });
}

async function getMap(beatmapID) {
  const url = `https://osu.ppy.sh/api/v2/beatmaps/${beatmapID}`;
  const headers = {
    Authorization: `Bearer ${process.env.osu_bearer_key}`,
  };
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  return await response.json();
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

async function cycleThroughEmbeds(client, interaction) {
  const channel = client.channels.cache.get(interaction.channelId);
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
  data: new SlashCommandBuilder()
    .setName("ct")
    .setDescription("Get the Turkish leaderboard of a map")
    .addStringOption((option) => option.setName("mods").setDescription("Sort by mods"))
    .addStringOption((option) => option.setName("link").setDescription("Get leaderboard by its beatmap link"))
    .addIntegerOption((option) => option.setName("page").setDescription("Specify what page it should be.")),
  run: async (client, interaction) => {
    await run(client, interaction);
  },
};
