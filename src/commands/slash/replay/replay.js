const { EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder } = require("discord.js");
const { Client } = require("ordr.js");

/**
 *
 * @param {Client} client
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */

async function render(_client, interaction, collection) {
  const userData = await collection.findOne({ _id: interaction.user.id });
  const skinID = userData?.replayConfig?.skinID ?? "3";
  const client = new Client(process.env.ORDR_TOKEN);
  let renderDone = false;

  const replayFile = interaction.options.getAttachment("file");
  if (!replayFile.name.endsWith(".osr")) {
    interaction.editReply("Please provide a valid osu! replay file. (ends in .osr)");
    return;
  }
  client.start();

  const replay = await getReplay(replayFile, userData, skinID, client, interaction.user.id);
  if (replay?.current === false) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Red").setTitle("Hmmm..").setDescription(`Something went wrong... Check if your file is on a submitted map.\n${replay.err}`)] });
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

  client.on("render_progress", await renderProgressListener);
  client.on("render_done", (data) => {
    renderDone = true;
    if (data.renderID === replay.renderID) {
      const embed = new EmbedBuilder().setTitle("Replay rendering is done").setColor("Purple").setDescription(replay_description);

      interaction.channel.send(`<@${interaction.user.id}> ${data.videoUrl}`);
      interaction.channel.send({ embeds: [embed] });
      return;
    }
  });
}

async function getReplay(file, userData, skinID, client, userID) {
  let replay;
  try {
    replay = await client.newRender({
      skip: true,
      username: "Mia",
      breakBGDim: userData?.replayConfig?.bg_dim,
      introBGDim: userData?.replayConfig?.bg_dim,
      BGParallax: userData?.replayConfig?.parallax,
      cursorRipples: userData?.replayConfig?.cursor_ripples,
      cursorSize: userData?.replayConfig?.cursor_size,
      inGameBGDim: userData?.replayConfig?.bg_dim,
      loadStoryboard: userData?.replayConfig?.storyboard,
      loadVideo: userData?.replayConfig?.bg_video,
      showKeyOverlay: userData?.replayConfig?.key_overlay,
      musicVolume: userData?.replayConfig?.music_volume,
      hitsoundVolume: userData?.replayConfig?.hitsound_volume,
      showDanserLogo: userData?.replayConfig?.danser_logo,
      useSkinColors: userData?.replayConfig?.skin_colors,
      playNightcoreSamples: userData?.replayConfig?.nightcore_hs,
      skip: userData?.replayConfig?.skip_intro,
      showAimErrorMeter: userData?.replayConfig?.aim_ur,
      showUnstableRate: userData?.replayConfig?.ur,
      showPPCounter: userData?.replayConfig?.pp_counter,
      sliderSnakingIn: userData?.replayConfig?.snaking_slider,
      sliderSnakingOut: userData?.replayConfig?.snaking_slider,
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

async function config(interaction, collection) {
  let userData = await collection.findOne({ _id: interaction.user.id });

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
  userData.replayConfig = options;
  await collection.updateOne({ _id: key }, { $set: { userData } }, { upsert: true });
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
  run: async (client, interaction, db) => {
    await interaction.deferReply();
    const subs = interaction.options.getSubcommand(false);
    const collection = db.collection("user_data");

    switch (subs) {
      case "render":
        await render(client, interaction, collection);
        break;
      case "config":
        await config(interaction, collection);
        break;
    }
  },
};
