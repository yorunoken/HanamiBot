const { buildMap } = require("../../../command-embeds/mapEmbed");
const { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(client, interaction, collection) {
  await interaction.deferReply();
  const messageLink = `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.id}`;

  const argValues = {
    mods: interaction.options.getString("mods"),
    ar: interaction.options.getNumber("ar"),
    od: interaction.options.getNumber("od"),
    cs: interaction.options.getNumber("cs"),
  };

  let osuFile = interaction.options.getAttachment("file");
  if (osuFile && !osuFile.name.endsWith(".osu")) {
    interaction.editReply("Please provide a valid .osu file. (ends in .osu)");
    return;
  }
  if (osuFile) {
    const attachment = osuFile.url;
    osuFile = await fetch(attachment);
    osuFile = await osuFile.text();

    const now5 = Date.now();
    const embed = await buildMap(undefined, argValues, collection, messageLink, osuFile);
    console.log(`Fetched embed in ${Date.now() - now5}ms`);

    interaction.editReply({ embeds: [embed] });
    return;
  }
  EmbedValue = 0;
  const link = interaction.options.getString("link");

  const regex = /\/osu\.ppy\.sh\/(b|beatmaps|beatmapsets)\/\d+/;
  let beatmapID;
  const now = Date.now();
  if (regex.test(link)) {
    beatmapID = link.match(/\d+$/)[0];
  } else {
    beatmapID = await cycleThroughEmbeds(client, interaction);
    if (!beatmapID) {
      interaction.editReply("No embeds found in the last 100 messages.");
      return;
    }
  }
  console.log(`found ID in ${Date.now() - now}ms`);

  const now3 = Date.now();
  const beatmap = await getMap(beatmapID);
  if (!beatmap) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Beatmap doesn't exist. check if you replied to a beatmapset.`)] });
    return;
  }
  console.log(`Fetched beatmap in ${Date.now() - now3}ms`);

  const now5 = Date.now();
  const embed = await buildMap(beatmap, argValues, collection, messageLink, osuFile);
  console.log(`Fetched embed in ${Date.now() - now5}ms`);

  interaction.editReply({ embeds: [embed] });
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

  if (embed.url && regex.test(embed.url)) {
    const beatmapID = embed.url.match(/\d+/)?.[0];
    if (beatmapID !== undefined) {
      return beatmapID;
    }
  }

  if (embed.description && regex.test(embed.description)) {
    const beatmapID = embed.description.match(/\d+/)?.[0];
    if (beatmapID !== undefined) {
      return beatmapID;
    }
  }

  if (embed.author && embed.author.url && regex.test(embed.author.url)) {
    const beatmapID = embed.author.url.match(/\d+/)?.[0];
    if (beatmapID !== undefined) {
      return beatmapID;
    }
  }

  return false;
}

async function cycleThroughEmbeds(client, interaction) {
  const channel = client.channels.cache.get(interaction.channel.id);
  const messages = await channel.messages.fetch({ limit: 100 });

  for (const [_, msg] of messages) {
    if (msg.embeds.length > 0 && msg.author.bot) {
      const embed = msg.embeds[0];
      const beatmapID = await findID(embed);
      if (beatmapID) {
        return beatmapID;
      }
    }
  }

  return false;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("map")
    .setDescription("Get the statistics of a beatmap!")
    .addStringOption((o) => o.setName("link").setDescription("The link of a beatmap"))
    .addAttachmentOption((o) => o.setName("file").setDescription(".osu file to calculate maps that aren't submitted"))
    .addStringOption((o) => o.setName("mods").setDescription("Calculate the pp based on mods"))
    .addNumberOption((o) => o.setName("ar").setDescription("Approach rate of the map").setMinValue(0).setMaxValue(11))
    .addNumberOption((o) => o.setName("od").setDescription("Overall difficulty of the map").setMinValue(0).setMaxValue(11))
    .addNumberOption((o) => o.setName("cs").setDescription("Circle size of the map").setMinValue(0).setMaxValue(10))
    .addNumberOption((o) => o.setName("bpm").setDescription("The map's beats per minute").setMinValue(60).setMaxValue(2000)),

  run: async (client, interaction, db) => {
    const collection = db.collection("map_cache");
    await run(client, interaction, collection);
  },
};
