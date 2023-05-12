const { buildCompareEmbed } = require("../../../command-embeds/compareEmbed");
const { EmbedBuilder } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernamePrefix");

async function run(message, username, mode, options, db, client) {
  await message.channel.sendTyping();
  GoodToGo = false;
  EmbedValue = 0;

  const index = options.index ?? options.i ?? undefined;
  const page = options.page ?? options.p ?? 1;
  const reverse = false;

  let beatmapID;
  const now = Date.now();
  if (message.reference) {
    beatmapID = await getEmbedFromReply(message, client);

    if (!beatmapID) {
      message.channel.send("The replied embed doesn't have a beatmap ID.");
      return;
    }
  } else {
    beatmapID = await cycleThroughEmbeds(client, message);
    if (!beatmapID) {
      message.channel.send("No embeds found in the last 100 messages.");
      return;
    }
  }
  console.log(`found ID in ${Date.now() - now}ms`);

  const now2 = Date.now();
  const user = await getUser(username, mode);
  console.log(`Fetched user in ${Date.now() - now2}ms`);
  if (user.error === null) {
    message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }

  const now3 = Date.now();
  const beatmap = await getMap(beatmapID);
  if (!beatmap) {
    message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Beatmap doesn't exist. check if you replied to a beatmapset.`)] });
    return;
  }
  console.log(`Fetched beatmap in ${Date.now() - now3}ms`);

  const now4 = Date.now();
  const scores = await getScores(user, beatmapID);
  if (scores.scores.length === 0) {
    message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No plays found for ${user.username}. Skill issue.`)] });
    return;
  }
  console.log(`Fetched scores in ${Date.now() - now4}ms`);

  const now5 = Date.now();
  const embed = await buildCompareEmbed(scores.scores, user, page, mode, index, reverse, db, beatmap);
  console.log(`Fetched embed in ${Date.now() - now5}ms`);

  message.channel.send({ embeds: [embed] });
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
        GoodToGo = true;
      }
    }
  }

  if (beatmapIDFound === false && embed.description) {
    if (regex.test(embed.description)) {
      beatmapID = embed.description.match(/\d+/)[0];
      if (beatmapID !== undefined) {
        beatmapIDFound = true;
        GoodToGo = true;
      }
    }
  }

  if (beatmapIDFound === false && embed.author?.url) {
    if (regex.test(embed.author?.url)) {
      beatmapID = embed.author?.url.match(/\d+/)[0];
      if (beatmapID !== undefined) {
        beatmapIDFound = true;
        GoodToGo = true;
      }
    }
  }

  if (!beatmapIDFound) {
    EmbedValue++;
    GoodToGo = false;
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
  name: "compare",
  aliases: ["compare", "c", "cp"],
  cooldown: 5000,
  run: async (client, message, args, prefix, db) => {
    const collection = db.collection("user_data");
    const username = await getUsername(message, args, collection, client);
    if (!username) return;

    wanted = ["-osu", "-mania", "-taiko", "-fruits"];
    const modes = wanted.filter((word) => args.indexOf(word) >= 0).map((word) => word.replace("-", ""));
    const mode = modes[0] ?? "osu";

    wanted = ["-p", "-page", "-i", "-index"];
    let options = [];
    wanted.forEach((word) => {
      if (args.includes(word)) {
        const key = word.replace("-", "");
        const value = args[args.indexOf(word) + 1];
        options[key] = value;
      }
    });

    await run(message, username, mode, options, db, client);
  },
};
