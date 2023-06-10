const { buildCompareEmbed } = require("../../../command-embeds/compareEmbed");
const { EmbedBuilder } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernamePrefix");
const { v2 } = require("osu-api-extended");

async function run(message, username, mode, options, client, i, mapID) {
  await message.channel.sendTyping();

  const index = i ?? undefined;
  const page = options.page ?? options.p ?? 1;
  const reverse = false;

  let beatmapID;
  const now = Date.now();

  if (mapID) {
    beatmapID = mapID;
  } else if (message.reference) {
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

  const now2 = Date.now();
  const user = await v2.user.details(username, mode);

  if (user.error === null) {
    message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }

  const now3 = Date.now();
  const beatmap = await v2.beatmap.id.details(beatmapID);
  if (!beatmap) {
    message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Beatmap doesn't exist. check if you replied to a beatmapset.`)] });
    return;
  }

  const now4 = Date.now();
  const scores = await v2.scores.user.beatmap(beatmapID, user.id, {
    mode: mode,
  });

  if (scores.length === 0) {
    message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No plays found for ${user.username} in osu!${mode === "osu" ? "standard" : mode}.`)] });
    return;
  }

  const now5 = Date.now();
  const embed = await buildCompareEmbed(scores, user, page, mode, index, reverse, beatmap);

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
  name: "compare",
  aliases: ["compare", "c", "cp"],
  cooldown: 5000,
  run: async ({ client, message, args, index }) => {
    // Extracting the number from the URL
    const numberRegex = /(\d+)$/;
    const numbers = args.map((arg) => {
      if (arg.includes("osu.ppy.sh")) {
        const matches = arg.match(numberRegex);
        return matches ? matches[1] : null;
      }
      return null;
    });
    const mapID = numbers[0];
    args = args.filter((arg) => !arg.includes("osu.ppy.sh"));

    const username = await getUsername(message, args, client);
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
    await run(message, username, mode, options, client, index, mapID);
  },
};
