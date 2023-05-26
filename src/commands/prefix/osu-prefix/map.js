const { buildMap } = require("../../../command-embeds/mapEmbed");
const { EmbedBuilder, Message } = require("discord.js");
const { v2 } = require("osu-api-extended");

/**
 * @param {Message} message
 */

async function run(message, client, args) {
  await message.channel.sendTyping();
  const regex = /\/osu\.ppy\.sh\/(b|beatmaps|beatmapsets)\/\d+/;

  let beatmapID;
  const now = Date.now();
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
  console.log(`found ID in ${Date.now() - now}ms`);

  const now3 = Date.now();
  const beatmap = await v2.beatmap.id.details(beatmapID);
  if (!beatmap) {
    message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Beatmap doesn't exist. check if you replied to a beatmapset.`)] });
    return;
  }
  console.log(`Fetched beatmap in ${Date.now() - now3}ms`);

  let argValues = {};
  for (const arg of args) {
    const [key, value] = arg.split("=");
    if (key && value) {
      argValues[key.toLowerCase()] = Number(value) || value.toLowerCase();
    }
  }

  const now5 = Date.now();
  const messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
  const embed = await buildMap(beatmap, argValues, messageLink);
  console.log(`Fetched embed in ${Date.now() - now5}ms`);

  message.channel.send({ embeds: [embed] });
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

  if (beatmapIDFound === false && embed.author.url) {
    if (regex.test(embed.author.url)) {
      beatmapID = embed.author.url.match(/\d+/)[0];
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
  name: "map",
  aliases: ["map", "m"],
  cooldown: 5000,
  run: async ({ client, message, args }) => {
    await run(message, client, args);
  },
};
