const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");
const { v2, mods } = require("osu-api-extended");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");
const { query } = require("../../../utils/getQuery.js");

/**
 *
 * @param {import("osu-api-extended/dist/types/v2_scores_user_category.js").response} score
 * @param {import("osu-api-extended/dist/types/v2_user_details.js").response} user
 * @param {string} mode
 */

async function getScore(score, user, mode, sliderbreakCount, unstableRate) {
  let modsName = score.mods.join("").toUpperCase();
  let mapID = score.beatmap.id;
  const valueGeki = score.statistics.count_geki;
  const value300 = score.statistics.count_300;
  const valueKatu = score.statistics.count_katu;
  const value100 = score.statistics.count_100;
  const value50 = score.statistics.count_50;
  const valueMiss = score.statistics.count_miss;
  const valueCombo = score.max_combo;

  const now = Date.now();
  let mapQuery = await query({ query: `SELECT file FROM maps WHERE id = ${mapID}`, type: "get", name: "file" });

  if (!mapQuery || (score.beatmapset.status !== "ranked" && score.beatmapset.status !== "loved" && score.beatmapset.status !== "approved")) {
    const downloader = new Downloader({
      rootPath: "./cache",

      filesPerSecond: 0,
      synchronous: true,
    });

    downloader.addSingleEntry(
      new DownloadEntry({
        id: mapID,
        save: false, // Don't save file on a disk.
      })
    );

    const downloaderResponse = await downloader.downloadSingle();
    if (downloaderResponse.status == -3) {
      throw new Error("ERROR CODE 409, ABORTING TASK");
    }
    osuFile = downloaderResponse.buffer.toString();
    if (mapQuery) {
      const q = `UPDATE maps
      SET file = ?
      WHERE id = ?`;

      await query({ query: q, parameters: [osuFile, mapID], type: "run" });
    } else {
      const q = `INSERT INTO maps (id, file) VALUES (?, ?)`;

      await query({ query: q, parameters: [mapID, osuFile], type: "run" });
    }
    mapQuery = osuFile;
  }

  let modsID = mods.id(modsName);
  let scoreParam = {
    mode: mode,
    mods: modsID,
  };
  let map = new Beatmap({ content: mapQuery });
  let calc = new Calculator(scoreParam);

  let curAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(valueMiss).combo(valueCombo).nGeki(valueGeki).nKatu(valueKatu).performance(map);
  let fcAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(0).combo(curAttrs.difficulty.maxCombo).nGeki(valueGeki).nKatu(valueKatu).performance(map);

  let value = `, ${curAttrs.difficulty.stars.toFixed(2)}*) ${(score.accuracy * 100).toFixed(2)}% ${score.max_combo}/${curAttrs.difficulty.maxCombo} ${score.statistics.count_miss}xMiss `;
  if (sliderbreakCount) {
    value += `${sliderbreakCount}xSB `;
  }
  value += `| ${curAttrs.pp.toFixed()}pp `;
  if ((score.statistics.count_miss < 20 || ppFc) && curAttrs.effectiveMissCount > 0) {
    value += `(${fcAttrs.pp.toFixed()}pp if FC) `;
  }
  if (unstableRate) {
    let ur = score.mods.join("").toLowerCase().includes("dt") || score.mods.join("").toLowerCase().includes("dt") ? `${unstableRate / 1.5}cv. UR` : `${unstableRate} UR`;

    value += `| ${ur} `;
  }

  return { value };
}

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function recent(interaction) {
  const { username, description, unstableRate, ppFc, sliderbreakCount, mode, modeInt } = options(interaction);
  const user = await v2.user.details(username, mode);

  let form = {
    limit: 1,
    include_fails: false,
  };
  const recent = (await v2.scores.user.category(user.id, "recent", form))[0];
  const { value } = await getScore(recent, user, modeInt, sliderbreakCount, unstableRate, ppFc);

  let artist = recent.beatmapset.artist;
  let title = recent.beatmapset.title;
  let version = recent.beatmap.version;
  let author = await v2.user.details(recent.beatmapset.user_id, "osu");

  let string = `${user.username} | ${artist} - ${title} - [${version}] (${author.username}${value}`;
  if (description) {
    string += `| ${description}`;
  }
  interaction.editReply(string);
}

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function map(interaction) {
  const { username, description, unstableRate, ppFc, sliderbreakCount, mode, modeInt, mods, mapID } = options(interaction);
  const user = await v2.user.details(username, mode);

  let form = {
    mode: mode,
    mods: mods,
  };
  const scores = (await v2.scores.user.beatmap(mapID, user.id, form))[0];
  let map = await v2.beatmap.id.details(mapID);

  scores.beatmapset = {};
  scores.beatmap = {};
  scores.beatmapset.status = map.status;
  scores.beatmap.id = map.id;
  const { value } = await getScore(scores, user, modeInt, sliderbreakCount, unstableRate, ppFc);

  let artist = map.beatmapset.artist;
  let title = map.beatmapset.title;
  let version = map.version;
  let author = await v2.user.details(map.beatmapset.user_id, "osu");

  let string = `${user.username} | ${artist} - ${title} - [${version}] (${author.username}${value}`;
  if (description) {
    string += `| ${description}`;
  }
  interaction.editReply(string);
}

function options(interaction) {
  const username = interaction.options.getString("user"); // username string
  const description = interaction.options.getString("description"); // description string
  const unstableRate = interaction.options.getNumber("ur"); // ur number
  const ppFc = interaction.options.getBoolean("ppfc"); // ppfc boolean
  const sliderbreakCount = interaction.options.getNumber("sliderbreaks"); // sliderbreak count number
  const mods = interaction.options.getString("mods");
  const link = interaction.options.getString("link");
  const mode = interaction.options.getString("mode") ?? "osu";

  let modeInt;
  switch (mode) {
    case "osu":
      modeInt = 0;
      break;
    case "taiko":
      modeInt = 1;
      break;
    case "fruits":
      modeInt = 2;
      break;
    case "mania":
      modeInt = 3;
      break;
  }
  let mapID = link.match(/\d+$/)[0];

  return { username, description, unstableRate, ppFc, sliderbreakCount, mods, mode, modeInt, mapID };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("scorepost")
    .setDescription("Generates prompts to make score posts.")
    .addSubcommand((o) =>
      o
        .setName("recent")
        .setDescription("Generates a scorepost for a player's most recent score")
        .addStringOption((o) => o.setName("user").setDescription("osu! username of the user.").setRequired(true))
        .addStringOption((option) =>
          option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "fruits", value: "fruits" })
        )
        .addStringOption((o) => o.setName("description").setDescription("Adds a comment to the scorepost."))
        .addNumberOption((o) => o.setName("ur").setDescription("Adds (and converts if neccessary) UR onto the scorepost."))
        .addBooleanOption((o) => o.setName("ppfc").setDescription("Adds/removes pp for fc from the title. It is on by default for plays with 20 or less misses."))
        .addNumberOption((o) => o.setName("sliderbreaks").setDescription("Specifies sliderbreak count."))
    )
    .addSubcommand((o) =>
      o
        .setName("map")
        .setDescription("Generates a scorepost for a player's score on a map (highest score if no mods are provided)")
        .addStringOption((o) => o.setName("user").setDescription("osu! username of the user.").setRequired(true))
        .addStringOption((option) => option.setName("link").setDescription("The link (or ID) of the beatmap").setRequired(true))
        .addStringOption((option) =>
          option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "fruits", value: "fruits" })
        )
        .addStringOption((o) => o.setName("description").setDescription("Adds a comment to the scorepost."))
        .addStringOption((o) => o.setName("mods").setDescription("Specifies mods."))
        .addNumberOption((o) => o.setName("ur").setDescription("Adds (and converts if neccessary) UR onto the scorepost."))
        .addBooleanOption((o) => o.setName("ppfc").setDescription("Adds/removes pp for fc from the title. It is on by default for plays with 20 or less misses."))
        .addNumberOption((o) => o.setName("sliderbreaks").setDescription("Specifies sliderbreak count."))
    ),
  run: async ({ interaction }) => {
    await interaction.deferReply();
    const cmds = interaction.options.getSubcommand(false);

    switch (cmds) {
      case "recent":
        await recent(interaction);
        break;
      case "map":
        await map(interaction);
        break;
    }
  },
};
