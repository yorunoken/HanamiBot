const { buildSim } = require("../../../command-embeds/simulateEmbed.js");
const { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");
const { v2 } = require("osu-api-extended");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(client, interaction) {
  await interaction.deferReply();
  const messageLink = `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.id}`;

  const argValues = {
    mods: interaction.options.getString("mods"),
    ar: interaction.options.getNumber("ar"),
    od: interaction.options.getNumber("od"),
    cs: interaction.options.getNumber("cs"),
    n300: interaction.options.getNumber("n300"),
    n100: interaction.options.getString("n100"),
    n50: interaction.options.getNumber("n50"),
    acc: interaction.options.getNumber("accuracy"),
    n_misses: interaction.options.getNumber("misses"),
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
    const embed = await buildSim(undefined, argValues, messageLink, osuFile, "osu", 0);
    console.log(`Fetched embed in ${Date.now() - now5}ms`);

    interaction.editReply({ content: "Disclaimer: This command only works for standard.", embeds: [embed] });
    return;
  }
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
  const beatmap = await v2.beatmap.id.details(beatmapID);
  if (!beatmap) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Beatmap doesn't exist. check if you replied to a beatmapset.`)] });
    return;
  }
  console.log(`Fetched beatmap in ${Date.now() - now3}ms`);

  const mode = beatmap.mode;
  if (mode == "mania" || mode == "fruits") {
    const embed = new EmbedBuilder().setDescription("Sorry, but the simulate command only works for `osu` and `taiko`. :(");
    return interaction.editReply({ embeds: [embed] });
  }

  const now5 = Date.now();
  const embed = await buildSim(beatmap, argValues, messageLink, osuFile, mode, beatmap.mode_int);
  console.log(`Fetched embed in ${Date.now() - now5}ms`);

  interaction.editReply({ embeds: [embed] });
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
    .setName("simulate")
    .setDescription("Simulate a score!")
    .addStringOption((o) => o.setName("link").setDescription("The link of a beatmap"))
    .addAttachmentOption((o) => o.setName("file").setDescription(".osu file to calculate maps that aren't submitted"))
    .addStringOption((o) => o.setName("mods").setDescription("Calculate the pp based on mods"))
    .addNumberOption((o) => o.setName("accuracy").setDescription("What the accuracy of the simulated play should be"))
    .addNumberOption((o) => o.setName("n300").setDescription("How many 300s should be simulated"))
    .addNumberOption((o) => o.setName("n100").setDescription("How many 100s should be simulated"))
    .addNumberOption((o) => o.setName("n50").setDescription("How many 50s should be simulated"))
    .addNumberOption((o) => o.setName("misses").setDescription("How many misses should be simulated"))
    .addNumberOption((o) => o.setName("ar").setDescription("Approach rate of the map").setMinValue(0).setMaxValue(11))
    .addNumberOption((o) => o.setName("od").setDescription("Overall difficulty of the map").setMinValue(0).setMaxValue(11))
    .addNumberOption((o) => o.setName("cs").setDescription("Circle size of the map").setMinValue(0).setMaxValue(10))
    .addNumberOption((o) => o.setName("bpm").setDescription("The map's beats per minute").setMinValue(60).setMaxValue(2000)),

  run: async ({ client, interaction }) => {
    await run(client, interaction);
  },
};
