const { EmbedBuilder } = require("discord.js");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");
const { query } = require("../utils/getQuery.js");
const { tools, mods } = require("osu-api-extended");
const { generateHitResults } = require("../utils/generate_hitResults.js");

async function buildSim(beatmap, argValues, messageLink, file, mode, RuleSetID) {
  let ar, cs, od;
  if (!file) {
    const downloader = new Downloader({
      rootPath: "./cache",

      filesPerSecond: 0,
      synchronous: true,
    });

    downloader.addSingleEntry(
      new DownloadEntry({
        id: beatmap.id,
        save: false, // Don't save file on a disk.
      })
    );
    const downloaderResponse = await downloader.downloadSingle();
    if (downloaderResponse.status == -3) {
      throw new Error("ERROR CODE 409, ABORTING TASK");
    }
    let mapQuery = await query({ query: `SELECT file FROM maps WHERE id = ${beatmap.id}`, type: "get", name: "file" });

    osuFile = downloaderResponse.buffer.toString();
    if (!mapQuery) {
      await query({ query: `INSERT INTO maps (id, file) VALUES (?, ?)`, parameters: [beatmap.id.toString(), osuFile], type: "run" });
    }
    if (beatmap.status != "ranked" && beatmap.status != "loved" && beatmap.status != "approved") {
      const q = `UPDATE maps
        SET file = ?
        WHERE id = ?`;

      await query({ query: q, parameters: [mapQuery, beatmap.id], type: "run" });
    }

    ar = Number(argValues["ar"]) || beatmap?.ar;
    cs = Number(argValues["cs"]) || beatmap?.cs;
    od = Number(argValues["od"]) || beatmap?.accuracy;
  } else {
    osuFile = file;
  }

  const argMods = argValues["mods"] ?? "NM";
  const modsID = mods.id(argMods);

  let clockRate =
    argValues["clock_rate"] !== undefined
      ? argValues["clock_rate"]
      : argValues["clockrate"] !== undefined
      ? argValues["clockrate"]
      : argValues["cr"] !== undefined
      ? argValues["cr"]
      : argValues["mods"]?.toUpperCase()?.includes("DT") || argValues["mods"]?.toUpperCase()?.includes("NC")
      ? 1.5
      : argValues["mods"]?.toUpperCase()?.includes("HT")
      ? 0.75
      : 1;
  clockRate = Number(clockRate);

  let mapParam = {
    content: osuFile,
    ar: ar,
    cs: cs,
    od: od,
  };

  let scoreParam = {
    mode: RuleSetID,
    mods: modsID,
  };

  let map = new Beatmap(mapParam);
  let calc = new Calculator(scoreParam);

  let mapValues = calc.clockRate(clockRate).mapAttributes(map);
  if (argValues["bpm"]) {
    clockRate = argValues["bpm"] / mapValues.bpm;
    mapValues = calc.clockRate(clockRate).mapAttributes(map);
  }

  let maxAttrs = calc.clockRate(clockRate).acc(100).performance(map);

  const objects =
    mode === "taiko"
      ? maxAttrs.difficulty.maxCombo
      : (maxAttrs.difficulty.nCircles ?? beatmap.count_circles ?? 0) + (maxAttrs.difficulty.nDroplets ?? 0) + (maxAttrs.difficulty.nFruits ?? 0) + (maxAttrs.difficulty.nSliders ?? beatmap.count_sliders ?? 0) + (maxAttrs.difficulty.nSpinners ?? 0);
  const hits = generateHitResults({ data: argValues, objectCount: objects, mode: mode });

  let performance = calc
    .clockRate(clockRate)
    .n300(hits.n300 ?? 0)
    .n100(hits.n100 ?? 0)
    .n50(hits.n50 ?? 0)
    .nMisses(hits.n_misses ?? 0)
    .combo(argValues.combo ?? maxAttrs.difficulty.maxCombo)
    .performance(map);

  let fcPerformance = calc
    .clockRate(clockRate)
    .n300(hits.n300 ?? 0)
    .n100(hits.n100 ?? 0)
    .n50(hits.n50 ?? 0)
    .combo(argValues.combo ?? maxAttrs.difficulty.maxCombo)
    .nMisses(0)
    .performance(map);

  if (!performance.difficulty.nCircles) performance.difficulty.nCircles = 0;
  if (!performance.difficulty.nSliders) performance.difficulty.nSliders = 0;
  if (!performance.difficulty.nSpinners) performance.difficulty.nSpinners = 0;
  if (!performance.difficulty.nFruits) performance.difficulty.nFruits = 0;

  let osuEmote;
  switch (mode) {
    case "osu":
      osuEmote = "<:osu:1075928459014066286>";
      break;
    case "mania":
      osuEmote = "<:mania:1075928451602718771>";
      break;
    case "taiko":
      osuEmote = "<:taiko:1075928454651969606>";
      break;
    case "fruits":
      osuEmote = "<:ctb:1075928456367444018>";
      break;
    default:
      osuEmote = "";
  }

  const starsRaw = performance.difficulty.stars;
  const starsFixed = starsRaw.toFixed(2);
  const modsUpperCase = argMods.toUpperCase();

  let arValue = mapValues.ar.toFixed(1);
  let odValue = mapValues.od.toFixed(1);
  let csValue = mapValues.cs.toFixed(2);
  let hpValue = mapValues.hp.toFixed(1);
  let bpmValue = mapValues.bpm.toFixed();

  switch (RuleSetID) {
    case 1:
      arValue = "-";
      csValue = "-";
      break;
    case 3:
      arValue = "-";
      csValue = "-";
      break;
  }

  const beatmapMaxCombo = performance.difficulty.maxCombo.toLocaleString();

  //length
  const lengthInSeconds = (beatmap?.total_length / mapValues.clockRate).toFixed(0);
  const minutes = Math.floor(lengthInSeconds / 60);
  const seconds = (lengthInSeconds % 60).toString().padStart(2, "0");
  const mapLength = `\`${minutes}:${seconds}\``;

  var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const updatedDate = new Date(beatmap?.last_updated).toLocaleDateString("en-US", options);

  let Updated_at;
  switch (beatmap?.status) {
    case "ranked":
      Updated_at = `Ranked at ${updatedDate}`;
    case "loved":
      Updated_at = `Loved at ${updatedDate}`;
    case "qualified":
      Updated_at = `Qualified at ${updatedDate}`;
    default:
      Updated_at = `Last updated at ${updatedDate}`;
  }
  if (!updatedDate) {
    Updated_at = "Last updated at Unknown";
  }

  const grades = {
    A: "<:A_:1057763284327080036>",
    B: "<:B_:1057763286097076405>",
    C: "<:C_:1057763287565086790>",
    D: "<:D_:1057763289121173554>",
    F: "<:F_:1057763290484318360>",
    S: "<:S_:1057763291998474283>",
    SH: "<:SH_:1057763293491642568>",
    X: "<:X_:1057763294707974215>",
    XH: "<:XH_:1057763296717045891>",
  };

  const scoreRank = tools.rank({ 0: hits.n_misses ?? 0, 100: hits.n100 ?? 0, 300: hits.n300 ?? 0, 50: hits.n50 ?? 0 }, argMods, mode);
  const grade = grades[scoreRank];

  const acc = tools.accuracy(
    {
      300: hits.n300 ?? 0,
      geki: hits.n_geki ?? 0,
      100: hits.n100 ?? 0,
      katu: hits.n_katu ?? 0,
      50: hits.n50 ?? 0,
      0: hits.n_misses ?? 0,
    },
    mode
  );

  let accValues = "";
  switch (mode) {
    case "osu":
      accValues = `{ ${hits.n300 ?? 0}/${hits.n100 ?? 0}/${hits.n50 ?? 0}/${hits.n_misses ?? 0} }`;
      break;
    case "taiko":
      accValues = `{ ${hits.n300 ?? 0}/${hits.n100 ?? 0}/${hits.n_misses ?? 0} }`;
      break;
    case "mania":
      accValues = `{ ${hits.n_geki ?? 0}/${hits.n_katu}/${hits.n300 ?? 0}/${hits.n100 ?? 0}/${hits.n50 ?? 0}/${hits.n_misses ?? 0} }`;
      break;
    case "fruits":
      accValues = `{ ${hits.n300 ?? 0}/${hits.n100 ?? 0}/${hits.n50 ?? 0}/${hits.n_katu}/${hits.n_misses ?? 0} }`;
      break;
  }

  let ppValue = `**${performance.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}pp`;
  const otherValues = `[ **${performance.difficulty.maxCombo}**x/${maxAttrs.difficulty.maxCombo}x ] ${accValues}`;
  const topRow = `${grade} ${ppValue} **+${modsUpperCase}**  (${acc}%)`;
  let ifFc = "";
  if (performance.effectiveMissCount > 0) {
    const FcAcc = tools.accuracy(
      {
        300: hits.n300 + hits.n_misses ?? 0,
        geki: hits.n_geki ?? 0,
        100: hits.n100 ?? 0,
        katu: hits.n_katu ?? 0,
        50: hits.n50 ?? 0,
        0: hits.n_misses ?? 0,
      },
      mode
    );

    ifFc = `\nIf FC: **${fcPerformance.pp.toFixed(2)}**pp for **${FcAcc.toFixed(2)}%**`;
  }

  if (file) {
    const regex = /\[Metadata\]\s*Title:(.*?)(?:\r?\n|\r)TitleUnicode:(.*?)(?:\r?\n|\r)?(?:Artist:(.*?)(?:\r?\n|\r))?ArtistUnicode:(.*?)(?:\r?\n|\r)?(?:Creator:(.*?)(?:\r?\n|\r))?Version:(.*?)(?:\r?\n|\r)/s;

    const match = file.match(regex);
    const [, title, artist, creator, version] = match;
    if (!match) {
      return new EmbedBuilder().setDescription("Your .osu file has no metadata values.");
    }
    const metadata = {
      title: title ? title.trim() : "",
      artist: artist ? artist.trim() : "",
      creator: creator ? creator.trim() : "",
      version: version ? version.trim() : "",
    };

    const field = {
      name: `${osuEmote} **__[${metadata.version}] [${starsFixed}★]__**`,
      value: `${topRow}\n${otherValues}${ifFc}\n\nBPM: \`${bpmValue}\`\nMax Combo: \`${beatmapMaxCombo}x\` Objects: \`${objects}\`\nAR: \`${arValue}\` OD: \`${odValue}\` CS: \`${csValue}\` HP: \`${hpValue}\``,
    };

    embed = new EmbedBuilder()
      .setColor("Purple")
      .setAuthor({
        name: `Beatmap by ${metadata.creator}`,
      })
      .setTitle(`${metadata.artist} - ${metadata.title}`)
      .setFields(field)
      .setFooter({ text: Updated_at });
  } else {
    const field = {
      name: `${osuEmote} **__[${beatmap.version}] [${starsFixed}★]__**`,
      value: `${topRow}\n${otherValues}${ifFc}\n\nLength: ${mapLength} Max Combo: \`${beatmapMaxCombo}x\` Objects: \`${objects}\`\nBPM: \`${bpmValue}\` AR: \`${arValue}\` OD: \`${odValue}\` CS: \`${csValue}\` HP: \`${hpValue}\``,
    };

    embed = new EmbedBuilder()
      .setColor("Purple")
      .setAuthor({
        name: `Beatmap by ${beatmap?.beatmapset?.creator}`,
        url: `https://osu.ppy.sh/users/${beatmap?.user_id}`,
        iconURL: `https://a.ppy.sh/${beatmap?.user_id}?1668890819.jpeg`,
      })
      .setTitle(`${beatmap?.beatmapset?.artist} - ${beatmap?.beatmapset?.title}`)
      .setFields(field)
      .setURL(`https://osu.ppy.sh/b/${beatmap?.id}`)
      .setImage(`https://assets.ppy.sh/beatmaps/${beatmap?.beatmapset_id}/covers/cover.jpg`)
      .setFooter({ text: Updated_at });
  }
  return embed;
}

module.exports = { buildSim };
