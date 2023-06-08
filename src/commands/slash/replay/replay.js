const { EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder } = require("discord.js");
const { Client } = require("ordr.js");
const client = new Client(process.env.ORDR_TOKEN);
const { query } = require("../../../utils/getQuery.js");

/**
 *
 * @param {Client} client
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */

async function render(interaction) {
  const userData = await query({ query: `SELECT * FROM users WHERE id = ?`, parameters: [interaction.user.id], name: "value", type: "get" });
  const skinData = userData?.replayConfig;
  const skinID = skinData?.skinID ?? "3";
  let renderDone = false;

  const replayFile = interaction.options.getAttachment("file");
  if (!replayFile.name.endsWith(".osr")) {
    interaction.editReply("Please provide a valid osu! replay file. (ends in .osr)");
    return;
  }
  client.start();

  const replay = await getReplay(replayFile, skinData, skinID, client, interaction.user.id);
  if (replay?.current === false) {
    interaction.editReply({
      embeds: [new EmbedBuilder().setColor("Red").setTitle("Hmmm..").setDescription(`Something went wrong... I might not have permissions to send messages on this channel. Or check if your file is on a submitted map.\n${replay.err}`)],
    });
    return;
  }

  let replay_description;

  const renderProgressListener = async (data) => {
    try {
      let thing;
      if (data.renderID === replay.renderID) {
        thing = await interaction.editReply({
          embeds: [new EmbedBuilder().setColor("Green").setTitle("Rendering your replay...").setDescription(`**${data.progress}**\n\nTaking too long? Take a look at your progress at [the website](https://ordr.issou.best/renders)`)],
        });
        replay_description = data.description;
      }
      if (renderDone && thing.deletable === true) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        thing.delete();
      }
    } catch (err) {
      interaction.editReply("There was an error! Please try again.");
      client.removeListener("render_progress", renderProgressListener);
      return;
    }
  };

  client.on("render_progress", renderProgressListener);

  let isMessageSent = false;
  client.on("render_done", (data) => {
    renderDone = true;
    if (data.renderID === replay.renderID && !isMessageSent) {
      const embed = new EmbedBuilder().setTitle("Replay rendering is done").setColor("Purple").setDescription(replay_description);

      interaction.channel.send(`<@${interaction.user.id}> ${data.videoUrl}`);
      interaction.channel.send({ embeds: [embed] });
      isMessageSent = true;
    }
  });
}

async function getReplay(file, skinData, skinID, client) {
  let replay;
  try {
    replay = await client.newRender({
      skip: true,
      username: "Mia",
      breakBGDim: skinData?.bg_dim,
      introBGDim: skinData?.bg_dim,
      BGParallax: skinData?.parallax,
      cursorRipples: skinData?.cursor_ripples,
      cursorSize: skinData?.cursor_size,
      inGameBGDim: skinData?.bg_dim,
      loadStoryboard: skinData?.storyboard,
      loadVideo: skinData?.bg_video,
      showKeyOverlay: skinData?.key_overlay,
      musicVolume: skinData?.music_volume,
      hitsoundVolume: skinData?.hitsound_volume,
      showDanserLogo: skinData?.danser_logo,
      useSkinColors: skinData?.skin_colors,
      playNightcoreSamples: skinData?.nightcore_hs,
      skip: skinData?.skip_intro,
      showAimErrorMeter: skinData?.aim_ur,
      showUnstableRate: skinData?.ur,
      showPPCounter: skinData?.pp_counter,
      sliderSnakingIn: skinData?.snaking_slider,
      sliderSnakingOut: skinData?.snaking_slider,
      resolution: "1280x720",
      skin: `${skinID}`,
      replayURL: file.url,
      //   devmode: "success",
    });
  } catch (err) {
    console.error(err);
    return { current: false, err: err };
  }
  return replay;
}

async function config(interaction) {
  const qUser = await query({ query: `SELECT * FROM users WHERE id = ?`, parameters: [interaction.user.id], name: "value", type: "get" });

  const numberArr = { bg_dim: 90, music_volume: 75, hitsound_volume: 50, cursor_size: 1, skinID: 3 };
  const booleanArr = {
    parallax: true,
    cursor_ripples: false,
    storyboard: true,
    bg_video: true,
    key_overlay: true,
    danser_logo: false,
    aim_ur: false,
    ur: true,
    pp_counter: true,
    snaking_slider: true,
    skin_colors: true,
    nightcore_hs: true,
    skip_intro: true,
  };

  const options = {
    ...getNumber(interaction, numberArr),
    ...getBoolean(interaction, booleanArr),
  };

  let q = `UPDATE users
  SET value = JSON_SET(value, ${Object.keys(options)
    .map((key) => `'$.${key}', ?`)
    .join(", ")})
  WHERE id = ?`;
  let parameters = [...Object.values(options), interaction.user.id];

  if (!qUser) {
    q = `INSERT INTO users (id, value) VALUES (?, JSON_OBJECT(${Object.keys(options)
      .map((key) => `'${key}', ?`)
      .join(", ")}))`;
    parameters = [interaction.user.id, ...Object.values(options)];

    await query({ query: q, parameters: parameters, type: "run" });
    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription("Your selected options have been applied!")] });
  }
  await query({ query: q, parameters: parameters, type: "run" });
  interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription("Your selected options have been applied!")] });
}

function getNumber(interaction, arr) {
  return Object.entries(arr).reduce((options, [key, value]) => {
    options[key] = interaction.options.getNumber(key) ?? value;
    return options;
  }, {});
}
function getBoolean(interaction, arr) {
  return Object.entries(arr).reduce((options, [key, value]) => {
    options[key] = interaction.options.getBoolean(key) ?? value;
    return options;
  }, {});
}

async function skins(interaction) {
  const page = interaction.options.getNumber("page") ?? 1;

  let skins = [];
  const skinPage = await getSkins(page);
  for (let i = 0; i < skinPage.SkinID.length; i++) {
    const name = skinPage.presentationNames[i];
    const id = skinPage.SkinID[i];
    skins.push(`\`#${id}\` **${name}**`);
  }
  const embed = new EmbedBuilder()
    .setTitle(`Skins list`)
    .setDescription(skins.join("\n"))
    .setFooter({ text: `page ${page}/23` });
  interaction.editReply({ embeds: [embed] });
}

async function getSkins(page) {
  const data = await client.skins({ pageSize: 20, page: page });
  const presentationNames = data.skins.map((x) => x.presentationName);
  const SkinID = data.skins.map((x) => x.id);
  return { presentationNames, SkinID };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("replay")
    .setDescription("Render a replay using o!rdr")
    .addSubcommand((option) =>
      option
        .setName("render")
        .setDescription("Render a replay using o!rdr")
        .addAttachmentOption((option) => option.setName("file").setDescription("The .osr file of the replay you want to").setRequired(true))
    )
    .addSubcommand((option) =>
      option
        .setName("config")
        .setDescription("Configure your options!")
        .addNumberOption((o) => o.setName("skin_id").setDescription("Set the skin ID | default: 3"))
        .addNumberOption((o) => o.setName("bg_dim").setDescription("Set the background dim | default: 90").setMinValue(0).setMaxValue(100))
        .addNumberOption((o) => o.setName("music_volume").setDescription("Set the music volume | default: 75").setMinValue(0).setMaxValue(100))
        .addNumberOption((o) => o.setName("hitsound_volume").setDescription("Set the hitsounds volume | default: 50").setMinValue(0).setMaxValue(100))
        .addNumberOption((o) => o.setName("cursor_size").setDescription("Set the cursor size | default: 1").setMinValue(0.5).setMaxValue(2))
        .addBooleanOption((o) => o.setName("parallax").setDescription("Enable background parallax | default: true"))
        .addBooleanOption((o) => o.setName("cursor_ripples").setDescription("Enable cursor ripples | default: false"))
        .addBooleanOption((o) => o.setName("storyboard").setDescription("Enable storyboard | default: true"))
        .addBooleanOption((o) => o.setName("bg_video").setDescription("Enable background video | default: true"))
        .addBooleanOption((o) => o.setName("key_overlay").setDescription("Enable key overlay | default: true"))
        .addBooleanOption((o) => o.setName("danser_logo").setDescription("Enable danser logo | default: false"))
        .addBooleanOption((o) => o.setName("aim_ur").setDescription("Enable aim UR | default: false"))
        .addBooleanOption((o) => o.setName("ur").setDescription("Enable UR | default: true"))
        .addBooleanOption((o) => o.setName("pp_counter").setDescription("Enable PP counter | default: true"))
        .addBooleanOption((o) => o.setName("snaking_slider").setDescription("Enable snaking slider | default: true"))
        .addBooleanOption((o) => o.setName("skin_colors").setDescription("Enable skin colors | default: true"))
        .addBooleanOption((o) => o.setName("nightcore_hs").setDescription("Enable nightcore hitsounds | default: true"))
        .addBooleanOption((o) => o.setName("skip_intro").setDescription("Enable skipping intro | default: true"))
    )
    .addSubcommand((option) =>
      option
        .setName("skins")
        .setDescription("Get a list of all available skins.")
        .addNumberOption((o) => o.setName("page").setDescription("Page Number"))
    ),
  run: async ({ interaction }) => {
    await interaction.deferReply();
    const subs = interaction.options.getSubcommand(false);

    switch (subs) {
      case "render":
        await render(interaction);
        break;
      case "config":
        await config(interaction);
        break;
      case "skins":
        await skins(interaction);
        break;
    }
  },
};
