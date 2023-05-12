const { EmbedBuilder } = require("discord.js");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");

const { tools } = require("../utils/tools.ts");
const { mods } = require("../utils/mods.js");

async function buildTopsEmbed(tops, user, pageNumber, mode, index, reverse, recent, db) {
  const collection = db.collection("map_cache"); // initialize collection of db

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

  if (reverse && recent) {
    tops.sort((b, a) => new Date(b.created_at) - new Date(a.created_at));
  } else if (!reverse && recent) {
    tops.sort((b, a) => new Date(a.created_at) - new Date(b.created_at));
  }

  if (reverse && !recent) {
    tops.sort((b, a) => b.pp - a.pp);
  } else if (!reverse && !recent) {
    tops.sort((b, a) => a.pp - b.pp);
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
  const scores = [...tops];

  async function getScoreEach(score) {
    scores.sort((a, b) => b.pp - a.pp);
    playRank = scores.findIndex((play) => play.id === score.id) + 1;

    const mapID = score.beatmap.id;
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

    const mapTitle = score.beatmapset.title;
    const mapArtist = score.beatmapset.artist;

    const acc = `(${Number(score.accuracy * 100).toFixed(2)}%)`;

    const now = Date.now();
    let foundMap = await collection.findOne({ id: `${mapID}` });
    console.log(`took ${Date.now() - now}ms to find map`);

    if (!foundMap) {
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
      const osuFile = downloaderResponse.buffer.toString();

      await collection.insertOne({ id: `${mapID}`, osuFile: osuFile });

      foundMap = {
        osuFile: osuFile,
      };
    }

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

    const map = new Beatmap({ content: foundMap.osuFile });
    const calc = new Calculator(scoreParam);

    // ss pp
    const maxAttrs = calc.performance(map);

    //normal pp
    const curAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(valueMiss).combo(valueCombo).nGeki(valueGeki).nKatu(valueKatu).performance(map);

    //fc pp
    const fcAttrs = calc.n300(value300).n100(value100).n50(value50).nMisses(0).combo(maxAttrs.difficulty.maxCombo).nGeki(valueGeki).nKatu(valueKatu).performance(map);

    const stars = maxAttrs.difficulty.stars.toFixed(2);
    const maxComboMap = maxAttrs.difficulty.maxCombo;

    let first_row = `**${playRank}.** [**${mapTitle} [${score.beatmap.version}]**](https://osu.ppy.sh/b/${mapID}) **+${modsName}** [${stars}★]\n`;
    let second_row = `${grade} ▹ **${curAttrs.pp.toFixed(2)}PP** ▹ ${acc} ▹ [**${Number(score.max_combo)}x**/${maxComboMap}x]\n`;
    let third_row = `${score.score.toLocaleString()} ▹ ${accValues} <t:${scoreTime}:R>`;
    let fourth_row = "";
    let fifth_row = "";

    let fields = "";
    let footer = "";
    let title = "";
    let url = "";

    if (index) {
      const acc = `(${Number(score.accuracy * 100).toFixed(2)}%)`;

      const status = score.beatmapset.status.charAt(0).toUpperCase() + score.beatmapset.status.slice(1);

      creator = score.beatmapset.creator;
      creator_id = score.beatmapset.user_id;

      hitLength = score.beatmap.hit_length;
      totalLength = score.beatmap.total_length;
      objects = score.beatmap.count_circles + score.beatmap.count_sliders + score.beatmap.count_spinners;

      //set title
      let Title = `${mapArtist} - ${mapTitle} [${score.beatmap.version}] [${curAttrs.difficulty.stars.toFixed(2)}★]`;

      if (curAttrs.effectiveMissCount > 0) {
        Map300CountFc = objects - value100 - value50;

        const FcAcc = tools.accuracy({
          n300: Map300CountFc,
          ngeki: valueGeki,
          n100: value100,
          nkatu: valueKatu,
          n50: value50,
          nmiss: 0,
          mode: mode,
        });

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
      url = `https://osu.ppy.sh/b/${score.beatmap.id}`;
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
    if (index > tops.length) {
      const embed = new EmbedBuilder().setColor("Purple").setDescription(`Please provide a number not greater than ${tops.length}`);
      return embed;
    }

    const setID = tops[index - 1].beatmapset.id;
    const scoreinfo = await getScoreEach(tops[index - 1]);

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setAuthor({
        name: `${user.username} ${userPP}pp (#${globalRank} ${countryCode}#${countryRank}) `,
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
  const totalPage = Math.ceil(tops.length / 5);

  if (pageNumber > totalPage) {
    const embed = new EmbedBuilder().setColor("Purple").setDescription(`Please provide a value not greater than ${totalPage}`);
    return embed;
  }

  const things = [];
  for (const index of indices) {
    if (tops[index]) {
      things.push(`${(await getScoreEach(tops[index])).rows}\n`);
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
      iconURL: `https://osu.ppy.sh/images/flags/${countryCode}.png`,
      url: `${userURL}`,
    })
    .setThumbnail(userAvatar)
    .setDescription(things.join(""))
    .setFooter({ text: `Page ${pageNumber}/${totalPage}` });
  return embed;
}

module.exports = { buildTopsEmbed };
