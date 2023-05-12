const { EmbedBuilder } = require("discord.js");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");

const { mods } = require("../utils/mods.js");

async function buildMap(beatmap, argValues, collection, message) {
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
  const osuFile = downloaderResponse.buffer.toString();
  await collection.insertOne({ id: `${beatmap.id}`, osuFile: osuFile });

  const argMods = argValues["mods"] ?? "NM";
  const modsID = mods.id(argMods);

  const bpm = argValues["bpm"] || beatmap.bpm;
  let ar = Number(argValues["ar"]) || beatmap.ar;
  let cs = Number(argValues["cs"]) || beatmap.cs;
  let od = Number(argValues["od"]) || beatmap.accuracy;

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
      : bpm / beatmap.bpm;

  clockRate = Number(clockRate);

  const RuleSetID = beatmap.mode_int;

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

  const mapValues = calc.clockRate(clockRate).mapAttributes(map);

  const performanceAcc100 = calc.clockRate(clockRate).acc(100).performance(map);
  const performanceAcc99 = calc.clockRate(clockRate).acc(99).performance(map);
  const performanceAcc97 = calc.clockRate(clockRate).acc(97).performance(map);
  const peformanceAcc95 = calc.clockRate(clockRate).acc(95).performance(map);

  let customAccPP = "";
  if (argValues.acc) {
    const customPP = calc.acc(Number(argValues.acc)).performance(map);
    customAccPP = `\n(${Number(argValues.acc)}%:  ${customPP.pp.toFixed(1)})`;
  }
  if (Number(argValues.acc) < 16.67) {
    const customPP = calc.acc(16.67).performance(map);
    customAccPP = `\n16.67%: ${customPP.pp.toFixed(1)}`;
  }

  if (!performanceAcc100.difficulty.nCircles) performanceAcc100.difficulty.nCircles = 0;
  if (!performanceAcc100.difficulty.nSliders) performanceAcc100.difficulty.nSliders = 0;
  if (!performanceAcc100.difficulty.nSpinners) performanceAcc100.difficulty.nSpinners = 0;
  if (!performanceAcc100.difficulty.nFruits) performanceAcc100.difficulty.nFruits = 0;

  let osuEmote;
  switch (beatmap.mode) {
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
      osuEmote = "No gamemode found.";
  }

  const starsRaw = performanceAcc100.difficulty.stars;
  const starsFixed = starsRaw.toFixed(2);
  const modsUpperCase = argMods.toUpperCase();

  const messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
  const beatmapObjects = performanceAcc100.difficulty.nCircles + performanceAcc100.difficulty.nSliders + performanceAcc100.difficulty.nSpinners + performanceAcc100.difficulty.nFruits;

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

  const beatmapMaxCombo = performanceAcc100.difficulty.maxCombo.toLocaleString();
  const beatmapFavoriteCount = beatmap.beatmapset.favourite_count.toLocaleString();
  const beatmapPlayCount = beatmap.beatmapset.play_count.toLocaleString();

  const acc95PP = peformanceAcc95.pp.toFixed(1);
  const acc97PP = performanceAcc97.pp.toFixed(1);
  const acc99PP = performanceAcc99.pp.toFixed(1);
  const acc100PP = performanceAcc100.pp.toFixed(1);

  //length
  const lengthInSeconds = (beatmap.total_length / mapValues.clockRate).toFixed(0);
  const minutes = Math.floor(lengthInSeconds / 60);
  const seconds = (lengthInSeconds % 60).toString().padStart(2, "0");
  const mapLength = `\`${minutes}:${seconds}\``;

  var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const updatedDate = new Date(beatmap.last_updated).toLocaleDateString("en-US", options);

  let Updated_at;
  switch (beatmap.status) {
    case "ranked":
      Updated_at = `Ranked at ${updatedDate}`;
    case "loved":
      Updated_at = `Loved at ${updatedDate}`;
    case "qualified":
      Updated_at = `Qualified at ${updatedDate}`;
    default:
      Updated_at = `Last updated at ${updatedDate}`;
  }

  const field1 = {
    name: `${osuEmote} **[${beatmap.version}]**`,
    value: `Stars: [**[${starsFixed}★]**](${messageLink} \"${starsRaw}\") Mods: \`${modsUpperCase}\` BPM: \`${bpmValue}\`\nLength: ${mapLength} Max Combo: \`${beatmapMaxCombo}x\` Objects: \`${beatmapObjects}\`\nAR: \`${arValue}\` OD: \`${odValue}\` CS: \`${csValue}\` HP: \`${hpValue}\`\n\n:heart:**${beatmapFavoriteCount}** :play_pause:**${beatmapPlayCount}**`,
  };
  const field2 = {
    name: "PP",
    value: `\`\`\`Acc | PP\n95%:  ${acc95PP}\n97%:  ${acc97PP}\n99%:  ${acc99PP}\n100%: ${acc100PP}${customAccPP}\`\`\``,
    inline: true,
  };
  const field3 = {
    name: "Links",
    value: `:notes:[Song Preview](https://b.ppy.sh/preview/${beatmap.beatmapset_id}.mp3)\n🎬[Map Preview](https://osu.pages.dev/preview#${beatmap.id})\n🖼️[Full Background](https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/raw.jpg)\n<:beatconnect:1075915329512931469>[Beatconnect](https://beatconnect.io/b/${beatmap.beatmapset_id})\n<:kitsu:1075915745973776405>[Kitsu](https://kitsu.moe/d/${beatmap.beatmapset_id})`,
    inline: true,
  };

  //embed
  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: `Beatmap by ${beatmap.beatmapset.creator}`,
      url: `https://osu.ppy.sh/users/${beatmap.user_id}`,
      iconURL: `https://a.ppy.sh/${beatmap.user_id}?1668890819.jpeg`,
    })
    .setTitle(`${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title}`)
    .setFields(field1, field2, field3)
    .setURL(`https://osu.ppy.sh/b/${beatmap.id}`)
    .setImage(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/cover.jpg`)
    .setFooter({ text: Updated_at });

  return embed;
}

module.exports = { buildMap };
