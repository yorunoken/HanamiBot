const { ContextMenuCommandBuilder } = require("discord.js");
const { ApplicationCommandType } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { buildCompareEmbed } = require("../../../command-embeds/compareEmbed");

async function run(client, interaction, db) {
  await interaction.deferReply();

  const collection = db.collection("user_data");

  const mode = "osu";
  const username = await getUsername(interaction, collection);
  if (!username) return;

  const guild = await client.guilds.fetch(interaction.guildId);
  const channel = guild.channels.cache.get(interaction.channelId);
  const messageRaw = await channel.messages.fetch(interaction.targetId);

  const beatmapID = findBeatmapID(messageRaw.embeds[0]);
  if (!beatmapID) {
    interaction.editReply("The replied embed doesn't have a beatmap ID.");
    return;
  }

  const nextPage = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);
  const prevPage = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
  const row = new ActionRowBuilder().addComponents(prevPage, nextPage);

  const user = await getUser(username, mode);
  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const beatmap = await getMap(beatmapID);
  if (!beatmap) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Beatmap doesn't exist. check if you replied to a beatmapset.`)] });
    return;
  }
  const scores = await getScores(user, beatmapID);
  if (scores.length === 0) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No plays found for ${user.username}. Skill issue.`)] });
    return;
  }
  let index;
  let reverse;
  const page = 1;

  const embed = await buildCompareEmbed(scores.scores, user, page, mode, index, reverse, db, beatmap);
  const response = await interaction.editReply({ embeds: [embed], components: [row] });
}

async function getScores(user, beatmapID) {
  const url = `https://osu.ppy.sh/api/v2/beatmaps/${beatmapID}/scores/users/${user.id}/all`;
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

function findBeatmapID(embed) {
  const regex = /^https?:\/\/osu\.ppy\.sh\/(b|beatmaps)\/\d+$/;
  let beatmapIDFound = false;

  if (!embed) {
    return undefined;
  }
  let beatmapID;
  if (embed.url) {
    if (regex.test(embed.url)) {
      beatmapID = testRegex(embed.url, regex);
      if (beatmapID !== undefined) {
        beatmapIDFound = true;
      }
    }
  }

  if (beatmapIDFound === false && embed.description) {
    if (regex.test(embed.description)) {
      beatmapID = testRegex(embed.description, regex);
      if (beatmapID !== undefined) {
        beatmapIDFound = true;
      }
    }
  }

  if (beatmapIDFound === false && embed.author?.url) {
    if (regex.test(embed.author.url)) {
      beatmapID = testRegex(embed.author.url, regex);
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

function testRegex(URL, regex) {
  if (!URL) {
    return undefined;
  }
  if (regex.test(URL)) {
    return URL.match(/\d+/)[0];
  }
  return undefined;
}

module.exports = {
  data: new ContextMenuCommandBuilder().setName("Compare score").setType(ApplicationCommandType.Message),
  run: async (client, interaction, db) => {
    await run(client, interaction, db);
  },
};
