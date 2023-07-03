const { EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(interaction) {
  const serverInfo = await getInfo({ endpoint: "serverInfo" });
  console.log(serverInfo);

  let url = interaction.options.getString("link");
  if (!url.includes("https://")) {
    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Error!").setColor("Red").setDescription("Please provide a valid URL.")] });
  }

  let form = {
    url,
    vCodec: "h264",
    vQuality: interaction.options.getString("quality") ?? "720",
    aFormat: interaction.options.getString("a_format") ?? "mp3",
    isAudioOnly: interaction.options.getString("audio_only") ?? false,
    isAudioMuted: interaction.options.getString("audio_muted") ?? false,
  };

  let properties = "";
  for (let obj of Object.entries(form)) {
    let prop = obj[0];
    properties += `**${prop}:** \`${form[prop]}\`\n`;
  }

  let res = await getInfo({ endpoint: "json", form });
  if (res.status === "error") {
    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Error!").setColor("Red").setDescription(res.text)] });
  }
  return interaction.editReply({ embeds: [new EmbedBuilder().setColor("Green").setTitle("Success!").setDescription(`[**__Click here to download the file__**](${res.url})`).setFields({ name: "Properties", value: properties }).setFooter({ text: res.status })] });
}

let baseUrl = "https://co.wuk.sh/api/";
async function getInfo({ endpoint, form }) {
  if (form) {
    return await fetch(baseUrl + endpoint, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(form),
      method: "POST",
    })
      .then((res) => res.json())
      .catch((e) => {
        throw new Error(e);
      });
  }
  return await fetch(baseUrl + endpoint)
    .then((res) => res.json())
    .catch((e) => {
      throw new Error(e);
    });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("download")
    .setDescription("Download any media you want.")
    .addStringOption((o) => o.setName("link").setDescription("Link to the media").setRequired(true))
    .addStringOption((o) =>
      o.setName("quality").setDescription("The quality of the video, defaults to 720p").addChoices({ name: "144p", value: "144" }, { name: "240p", value: "240" }, { name: "360p", value: "360" }, { name: "480p", value: "480" }, { name: "720p", value: "720" }, { name: "1080p", value: "1080" })
    )
    .addStringOption((o) => o.setName("a_format").setDescription("The audio format, defaults to mp3").addChoices({ name: "best", value: "best" }, { name: "mp3", value: "mp3" }, { name: "ogg", value: "ogg" }, { name: "wav", value: "wav" }))
    .addBooleanOption((o) => o.setName("audio_only").setDescription("Makes the media audio only. Defaults to false"))
    .addBooleanOption((o) => o.setName("audio_muted").setDescription("Disables audio track in video downloads. Defaults to false")),

  run: async ({ interaction }) => {
    await interaction.deferReply();
    await run(interaction);
  },
};
