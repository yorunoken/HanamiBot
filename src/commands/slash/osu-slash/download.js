const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");
const { v2 } = require("osu-api-extended");
const { authorize, authorize_file } = require("../../../utils/driveQuery.js");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(interaction) {
  await interaction.editReply(`Getting beatmap...`);

  let link = interaction.options.getString("link");
  const mapID = link.match(/\d+$/)[0];
  const beatmap = await v2.beatmap.id.details(mapID);
  await interaction.editReply(`Parsing beatmap ID`);

  let setId = beatmap.beatmapset.id;
  let file_path = `./osz/${mapID}.osz`;
  let host_name = "sayobot";
  let no_video = true;
  const callback = (progress) => {
    const random = Math.floor(Math.random() * 100);
    if (random < 50) {
      interaction.editReply(`Download in progress: ${progress.toFixed(1)}%`);
    }
  };
  await interaction.editReply("Searching database for map...");
  const fileId = await authorize_file(setId);
  if (fileId) {
    const url = `https://drive.google.com/file/d/${fileId}/view`;
    await interaction.editReply(`Map found: ${url}`);
    return;
  }

  await interaction.editReply(`Map not found, starting download..`);
  const path = await v2.beatmap.set.download(setId, file_path, host_name, no_video, callback);
  interaction.editReply(`Downloaded .osz file, uploading to google drive...`);

  const url = await authorize(setId, path);
  interaction.channel.send(`<@${interaction.user.id}>: ${url}`);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("download")
    .setDescription("Downloads a .osz file for you (because osu! servers suck)")
    .addStringOption((o) => o.setName("link").setDescription("Beatmap link").setRequired(true)),
  run: async ({ interaction }) => {
    await interaction.deferReply();
    await run(interaction);
  },
};