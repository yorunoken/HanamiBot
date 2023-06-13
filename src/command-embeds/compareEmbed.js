const { EmbedBuilder } = require("discord.js");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");
const { query } = require("../utils/getQuery.js");

const { tools, mods } = require("osu-api-extended");

async function buildCompareEmbed(score, user, pageNumber, mode, index, reverse, beatmap) {
  const start = (pageNumber - 1) * 5 + 1;
  const end = pageNumber * 5;
  const numbers = [];

  for (let i = start; i <= end; i++) {
    numbers.push(i);
  }
  const indices = numbers.map((num) => num - 1);

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

  //formatted values for user
  const globalRank = user.statistics.global_rank?.toLocaleString() ?? "-";
  const countryRank = user.statistics.country_rank?.toLocaleString() ?? "-";
  const userPP = user.statistics.pp.toLocaleString();
  const countryCode = user.country_code;
  const userAvatar = user.avatar_url;
  const userURL = `https://osu.ppy.sh/users/${user.id}/osu`;

  if (reverse) {
    score?.sort((b, a) => new Date(b.pp) - new Date(a.pp));
  } else {
    score?.sort((b, a) => new Date(a.pp) - new Date(b.pp));
  }

  //define the grades
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

  const scores = [...score];

  const mapID = beatmap.id;

  const now = Date.now();
  let mapQuery = await query({ query: `SELECT file FROM maps WHERE id = ${mapID}`, type: "get", name: "file" });

  if (!mapQuery) {
    const downloader = new Downloader({
      rootPath: "./osuBeatmapCache",

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

      query({ query: q, parameters: [mapQuery, mapID], type: "run" });
    } else {
      const q = `INSERT INTO maps (id, file) VALUES (?, ?)`;

      try {
        await query({ query: q, parameters: [mapID, osuFile], type: "run" });
      } catch (error) {
        // Handle the case where a duplicate id was inserted by updating the existing row instead
        const q = `UPDATE maps SET file = ? WHERE id = ?`;
        await query({ query: q, parameters: [osuFile, mapID], type: "run" });
      }
    }
    mapQuery = osuFile;
  }

  async function getScoreEach(score) {
    scores.sort((a, b) => b.pp - a.pp);
    playRank = scores.findIndex((play) => play.id === score.id) + 1;

    const mapTitle = beatmap.beatmapset.title;
    const mapArtist = beatmap.beatmapset.artist;

    let modsName = score.mods.join("");
    let modsID = mods.id(modsName);

    const valueGeki = score.statistics.count_geki;
    const value300 = score.statistics.count_300;
    const valueKatu = score.statistics.count_katu;
    const value100 = score.statistics.count_100;
    const value50 = score.statistics.count_50;
    const valueMiss = score.statistics.count_miss;
    const valueCombo = score.max_combo;

    const grade = grades[score.rank];

    const date = new Date(score.created_at);
    const scoreTime = date.getTime() / 1000;

    const acc = `(${Number(score.accuracy * 100).toFixed(2)}%)`;

    if (modsName.length == 0) {
      modsName = "NM";
      modsID = 0;
    }

    const scoreParam = {
      mode: rulesetID,
      mods: modsID,
    };

    let accValues;
    if (rulesetID == "0") accValues = `{**${value300}**/${value100}/${value50}/${valueMiss}}`;
    if (rulesetID == "1") accValues = `{**${value300}**/${value100}/${valueMiss}}`;
    if (rulesetID == "2") accValues = `{**${value300}**/${value100}/${value50}/${valueMiss}}`;
    if (rulesetID == "3") accValues = `{**${valueGeki}/${value300}**/${valueKatu}/${value100}/${value50}/${valueMiss}}`;

    const map = new Beatmap({ content: mapQuery });
    const calc = new Calculator(scoreParam);

    // ss pp
    const maxAttrs = calc.performance(map);

    //normal pp
    const curAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(valueMiss).combo(valueCombo).nGeki(valueGeki).nKatu(valueKatu).performance(map);

    //fc pp
    const fcAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(0).combo(maxAttrs.difficulty.maxCombo).nGeki(valueGeki).nKatu(valueKatu).performance(map);

    const stars = maxAttrs.difficulty.stars.toFixed(2);
    const maxComboMap = maxAttrs.difficulty.maxCombo;

    let ifFc = "";
    if (curAttrs.effectiveMissCount > 0) {
      const objects = beatmap.count_circles + beatmap.count_sliders + beatmap.count_spinners;
      Map300CountFc = objects - value100 - value50;

      const FcAcc = tools.accuracy(
        {
          300: Map300CountFc,
          geki: valueGeki,
          100: value100,
          katu: valueKatu,
          50: value50,
          0: 0,
        },
        mode
      );

      ifFc = `\nIf FC: **${fcAttrs.pp.toFixed(2)}**pp for **${FcAcc.toFixed(2)}%**`;
    }

    let first_row = `**#${playRank} +${modsName}** [${stars}★]\n`;
    let second_row = ` ${grade} ▹ **${curAttrs.pp.toFixed(2)}PP** ${acc} [**${Number(score.max_combo)}x**/${maxComboMap}x]\n`;
    let third_row = ` ${score.score.toLocaleString()} ▹ ${accValues} <t:${scoreTime}:R>`;
    let fourth_row = ifFc;
    let fifth_row = "";

    let fields = "";
    let footer = "";
    let title = "";
    let url = "";

    if (index) {
      const acc = `(${Number(score.accuracy * 100).toFixed(2)}%)`;

      creator = score.beatmapset.creator;
      crecator_id = score.beatmapset.user_id;

      hitLength = score.beatmap.hit_length;
      totalLength = score.beatmap.total_length;
      objects = score.beatmap.count_circles + score.beatmap.count_sliders + score.beatmap.count_spinners;
      const status = score.beatmapset.status.charAt(0).toUpperCase() + score.beatmapset.status.slice(1);

      //set title
      let Title = `${mapArtist} - ${mapTitle} [${score.beatmap.version}] [${curAttrs.difficulty.stars.toFixed(2)}★]`;

      if (curAttrs.effectiveMissCount > 0) {
        Map300CountFc = objects - value100 - value50;

        const FcAcc = tools.accuracy(
          {
            300: Map300CountFc,
            geki: valueGeki,
            100: value100,
            katu: valueKatu,
            50: value50,
            0: 0,
          },
          mode
        );

        pps = `**${curAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP ▹ (**${fcAttrs.pp.toFixed(2)}**PP for **${FcAcc.toFixed(2)}%**)`;
      } else {
        pps = `**${curAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`;
      }

      const mapValues = calc.mapAttributes(map);

      let Hit, Total;
      if (modsName.toLowerCase().includes("dt")) {
        Hit = (hitLength / 1.5).toFixed();
        Total = (totalLength / 1.5).toFixed();
      } else {
        Hit = hitLength;
        Total = totalLength;
      }

      let minutesHit = Math.floor(Hit / 60);
      let secondsHit = (Hit % 60).toString().padStart(2, "0");
      let minutesTotal = Math.floor(Total / 60);
      let secondsTotal = (Total % 60).toString().padStart(2, "0");

      first_row = `__**Personal Best #${playRank}:**__\n`;
      second_row = `${grade} ** +${modsName}** • ${score.score.toLocaleString()} • **${acc}**\n`;
      third_row = `${pps}\n`;
      fourth_row = `[**${score.max_combo}**x/${curAttrs.difficulty.maxCombo}x] • ${accValues}\n`;
      fifth_row = `Score Set <t:${scoreTime}:R>`;

      title = Title;
      url = `https://osu.ppy.sh/b/${mapID}`;
      fields = {
        name: `**Beatmap info:**`,
        value: `BPM: \`${mapValues.bpm.toFixed()}\` Objects: \`${objects.toLocaleString()}\` Length: \`${minutesTotal}:${secondsTotal}\` (\`${minutesHit}:${secondsHit}\`)\nAR: \`${mapValues.ar
          .toFixed(1)
          .toString()
          .replace(/\.0+$/, "")}\` OD: \`${mapValues.od.toFixed(1).toString().replace(/\.0+$/, "")}\` CS: \`${mapValues.cs.toFixed(1).toString().replace(/\.0+$/, "")}\` HP: \`${mapValues.hp.toFixed(2).toString().replace(/\.0+$/, "")}\``,
      };
      footer = { text: `${status} map by ${creator}`, iconURL: `https://a.ppy.sh/${creator_id}?1668890819.jpeg` };
    }

    const rows = `${first_row}${second_row}${third_row}${fourth_row}${fifth_row}`;

    return { rows, title, url, fields, footer };
  }

  if (index) {
    if (index > score.length) {
      const embed = new EmbedBuilder().setColor("Purple").setDescription(`Please provide a number not greater than ${score.length}`);
      return embed;
    }

    const setID = score[index - 1].beatmapset.id;
    const scoreinfo = await getScoreEach(score[index - 1]);

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setAuthor({
        name: `${user.username} ${userPP}pp (#${globalRank} ${countryCode}#${countryRank})`,
        iconURL: `https://osu.ppy.sh/images/flags/${countryCode}.png`,
        url: `https://osu.ppy.sh/users/${user.id}`,
      })
      .setTitle(scoreinfo.title)
      .setURL(scoreinfo.url)
      .setDescription(scoreinfo.rows)
      .setFields(scoreinfo.fields)
      .setThumbnail(`https://assets.ppy.sh/beatmaps/${setID}/covers/list.jpg`)
      .setFooter(scoreinfo.footer);

    return embed;
  }
  const totalPage = Math.ceil(score.length / 5);

  if (pageNumber > totalPage) {
    const embed = new EmbedBuilder().setColor("Purple").setDescription(`Please provide a value not greater than ${totalPage}`);
    return embed;
  }

  const things = [];
  for (const index of indices) {
    if (score[index]) {
      things.push(`${(await getScoreEach(score[index])).rows}\n`);
    } else {
      things.push("");
    }
  }
  if (things.length === 0) {
    things.push("**No scores found.**");
  }

  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: `${user.username}: ${userPP}pp (#${globalRank} ${countryCode}#${countryRank})`,
      iconURL: userAvatar,
      url: `${userURL}`,
    })
    .setDescription(things.join(""))
    .setTitle(`${beatmap.beatmapset.title} [${beatmap.version}]`)
    .setThumbnail(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/list.jpg`)
    .setURL(`https://osu.ppy.sh/b/${beatmap.id}`)
    .setFooter({ text: `Page ${pageNumber}/${totalPage}` });
  return embed;
}

module.exports = { buildCompareEmbed };
