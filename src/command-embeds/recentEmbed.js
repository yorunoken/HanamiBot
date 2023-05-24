const { EmbedBuilder } = require("discord.js");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");
const { query } = require("../utils/getQuery.js");
const { v2 } = require("osu-api-extended");

const { tools } = require("../utils/tools.ts");
const { mods } = require("../utils/mods.js");

//grades
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

function getRetryCount(retryMap, mapId) {
  let retryCounter = 0;
  for (let i = 0; i < retryMap.length; i++) {
    if (retryMap[i] === mapId) {
      retryCounter++;
    }
  }
  return retryCounter;
}

async function buildRecentsEmbed(score, user, mode, index) {
  let rulesetID;
  switch (mode) {
    case "osu":
      rulesetID = 0;
      break;
    case "mania":
      rulesetID = 3;
      break;
    case "fruits":
      rulesetID = 2;
      break;
    case "taiko":
      rulesetID = 1;
      break;
  }

  let modsName = score[index].mods.join("").toUpperCase();

  let filterMods = "";
  //   if (argValues["mods"] != undefined) {
  //     filteredscore = score.filter((x) => x.mods.join("").split("").sort().join("").toLowerCase() == argValues["mods"].split("").sort().join("").toLowerCase());
  //     score = filteredscore;
  //     try {
  //       FilterMods = `**Filtering mod(s): ${score[index].mods.join("").toUpperCase()}**`;
  //     } catch (err) {
  //       const embed = new EmbedBuilder().setColor("Purple").setDescription("Please provide a valid mod combination.");
  //       return embed;
  //     }
  //   }

  const mapID = score[index].beatmap.id;
  const valueGeki = score[index].statistics.count_geki;
  const value300 = score[index].statistics.count_300;
  const valueKatu = score[index].statistics.count_katu;
  const value100 = score[index].statistics.count_100;
  const value50 = score[index].statistics.count_50;
  const valueMiss = score[index].statistics.count_miss;
  const valueCombo = score[index].max_combo;

  //formatted values for user
  const globalRank = user.statistics.global_rank?.toLocaleString() ?? "-";
  const countryRank = user.statistics.country_rank?.toLocaleString() ?? "-";
  const userPP = user.statistics.pp.toLocaleString();

  // retry counter
  let retryMap = score.map((x) => x.beatmap.id);
  retryMap.splice(0, index);

  const mapStatus = score[index].beatmapset.status;
  const creatorID = score[index].beatmapset.user_id;
  const creatorName = score[index].beatmapset.creator;

  const now = Date.now();
  let mapQuery = await query({ query: `SELECT file FROM maps WHERE id = ${mapID}`, type: "get", name: "file" });
  console.log(`took ${Date.now() - now}ms to find map`);

  if (!mapQuery || (score[index].beatmapset.status !== "ranked" && score[index].beatmapset.status !== "loved" && score[index].beatmapset.status !== "approved")) {
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
      const q = `UPDATE users
      SET file = ?
      WHERE id = ?`;

      await query({ query: q, parameters: [osuFile, mapID], type: "run" });
    } else {
      const q = `INSERT INTO maps (id, file) VALUES (?, ?)`;

      await query({ query: q, parameters: [mapID, osuFile], type: "run" });
    }
    mapQuery = osuFile;
  }

  let ModDisplay = `**+${modsName}**`;
  let modsID = mods.id(modsName);

  if (!modsName.length) {
    ModDisplay = "**+NM**";
    modsID = 0;
  }

  let scoreParam = {
    mode: rulesetID,
    mods: modsID,
  };
  let map = new Beatmap({ content: mapQuery });
  let calc = new Calculator(scoreParam);

  const mapValues = calc.mapAttributes(map);

  // ss pp
  let maxAttrs = calc.performance(map);

  //normal pp
  let curAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(valueMiss).combo(valueCombo).nGeki(valueGeki).nKatu(valueKatu).performance(map);

  //fc pp
  let fcAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(0).combo(maxAttrs.difficulty.maxCombo).nGeki(valueGeki).nKatu(valueKatu).performance(map);

  const retryCounter = getRetryCount(retryMap, mapID);

  let accValues;
  if (rulesetID == "0") accValues = `{**${value300}**/${value100}/${value50}/${valueMiss}}`;
  if (rulesetID == "1") accValues = `{**${value300}**/${value100}/${valueMiss}}`;
  if (rulesetID == "2") accValues = `{**${value300}**/${value100}/${value50}/${valueMiss}}`;
  if (rulesetID == "3") accValues = `{**${valueGeki}/${value300}**/${valueKatu}/${value100}/${value50}/${valueMiss}}`;

  //formatted values for score
  let totalScore = score[index].score.toLocaleString();

  let objectshit = value300 + value100 + value50 + valueMiss;

  const objects = score[index].beatmap.count_circles + score[index].beatmap.count_sliders + score[index].beatmap.count_spinners;
  let fraction = objectshit / objects;
  let percentageRaw = Number(fraction * 100).toFixed(1);
  let percentageNum = percentageRaw;
  let percentage = `@${percentageNum}% `;
  if (percentageNum == "100.0" || score[index].passed == true) {
    percentage = "";
  }

  let ppValue = `**${curAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}pp [ **${score[index].max_combo}**x/${maxAttrs.difficulty.maxCombo}x ] ${accValues}`;
  let ifFc = "";
  if (curAttrs.effectiveMissCount > 0) {
    const Map300CountFc = objects - value100 - value50;

    const FcAcc = tools.accuracy({
      n300: Map300CountFc,
      ngeki: valueGeki,
      n100: value100,
      nkatu: valueKatu,
      n50: value50,
      nmiss: 0,
      mode: mode,
    });

    ifFc = `If FC: **${fcAttrs.pp.toFixed(2)}**pp for **${FcAcc.toFixed(2)}%**`;
  }

  let hitLength = score[index].beatmap.hit_length.toFixed();
  let totalLength = score[index].beatmap.hit_length.toFixed();
  if (modsName.toLowerCase().includes("dt")) {
    hitLength = (hitLength / 1.5).toFixed();
    totalLength = (totalLength / 1.5).toFixed();
  }

  let minutesTotal = Math.floor(totalLength / 60).toFixed();
  let secondsTotal = (totalLength % 60).toString().padStart(2, "0");

  const countryCode = user.country_code;
  const profileURL = `https://osu.ppy.sh/users/${user.id}/${mode}`;
  const avatarURL = user.avatar_url;

  const mapsetID = score[index].beatmapset.id;
  const acc = `${Number(score[index].accuracy * 100).toFixed(2)}%`;

  const scoreTime = new Date(score[index].created_at).getTime() / 1000;
  const grade = grades[score[index].rank];

  let scoreGlobalRank = "";
  if (score[index].passed === true) {
    const scoreGlobal = await v2.scores.details(score[index].best_id?.toString(), score[index].beatmap?.mode);
    if (score[index].id === score[index].best_id) {
      const scoreRank = scoreGlobal.rank_global;
      scoreGlobalRank = `__Global Rank #${scoreRank}__\n`;
    }
  }

  //score embed
  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: `${user.username} ${userPP}pp (#${globalRank} ${countryCode}#${countryRank}) `,
      // iconURL: `https://osu.ppy.sh/images/flags/${countryCode}.png`,
      iconURL: avatarURL,
      url: profileURL,
    })
    .setTitle(`${score[index].beatmapset.artist} - ${score[index].beatmapset.title} [${score[index].beatmap.version}] [${maxAttrs.difficulty.stars.toFixed(2)}★]`)
    .setURL(`https://osu.ppy.sh/b/${mapID}`)
    .setFields({
      name: `${scoreGlobalRank}${grade} ${percentage}${ModDisplay}  **${totalScore}  ${acc}** <t:${scoreTime}:R>`,
      value: `${ppValue}\n${ifFc} Try #${retryCounter}\n\nBPM: \`${mapValues.bpm.toFixed()}\` Length: \`${minutesTotal}:${secondsTotal}\`\nAR: \`${mapValues.ar.toFixed(1).toString().replace(/\.0+$/, "")}\` OD: \`${mapValues.od
        .toFixed(1)
        .toString()
        .replace(/\.0+$/, "")}\` CS: \`${mapValues.cs.toFixed(1).toString().replace(/\.0+$/, "")}\` HP: \`${mapValues.hp.toFixed(2).toString().replace(/\.0+$/, "")}\``,
    })
    .setThumbnail(`https://assets.ppy.sh/beatmaps/${mapsetID}/covers/list.jpg`)
    .setFooter({ text: `by ${creatorName}, ${mapStatus}`, iconURL: `https://a.ppy.sh/${creatorID}?1668890819.jpeg` });

  return { embed, filterMods };
}

module.exports = { buildRecentsEmbed };
