const { EmbedBuilder } = require("discord.js");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");
const { query } = require("../utils/getQuery.js");

const { mods } = require("../utils/mods.js");

async function leaderboard(beatmapID, scores, pageNumber, beatmap, requesterName, user) {
  const start = (pageNumber - 1) * 5 + 1;
  const end = pageNumber * 5;
  const numbers = [];

  for (let i = start; i <= end; i++) {
    numbers.push(i);
  }
  const indices = numbers.map((num) => num - 1);

  if (scores.scores.length == 0) {
    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setTitle(`${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.version}]`) // [${starRating.difficulty.starRating.toFixed(2)}★]
      .setURL(`https://osu.ppy.sh/b/${beatmap.id}`)
      .setDescription(`**No scores found.**`)
      .setImage(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/cover.jpg`);

    return embed;
  }

  const now = Date.now();
  let mapQuery = await query({ query: `SELECT file FROM maps WHERE id = ${beatmapID}`, type: "get", name: "file" });
  console.log(`took ${Date.now() - now}ms to find map`);

  if (!mapQuery) {
    const downloader = new Downloader({
      rootPath: "./osuBeatmapCache",

      filesPerSecond: 0,
      synchronous: true,
    });

    downloader.addSingleEntry(
      new DownloadEntry({
        id: beatmapID,
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

      query({ query: q, parameters: [mapQuery, beatmapID], type: "run" });
    } else {
      const q = `INSERT INTO maps (id, file) VALUES (?, ?)`;

      query({ query: q, parameters: [beatmapID, mapQuery], type: "run" });
    }
    mapQuery = osuFile;
  }

  let map = new Beatmap({ content: mapQuery });

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

  const totalPage = Math.ceil(scores.scores.length / 5);

  async function ScoreGet(score, num) {
    const modsRaw = score.mods.map((mod) => mod.acronym).join("");
    let modsID = mods.id(modsRaw);

    let modShow;
    if (modsRaw != "") {
      modShow = `\`+${modsRaw}\` `;
    } else {
      modShow = "";
      modsID = 0;
    }

    // std
    if (score.statistics.great === undefined) score.statistics.great = 0;
    if (score.statistics.ok === undefined) score.statistics.ok = 0;
    if (score.statistics.meh === undefined) score.statistics.meh = 0;
    if (score.statistics.miss === undefined) score.statistics.miss = 0;

    // mania
    if (score.statistics.perfect === undefined) score.statistics.perfect = 0; // geki
    if (score.statistics.good === undefined) score.statistics.good = 0; // katu

    let accValues;
    if (beatmap.mode_int == "0") accValues = `{**${score.statistics.great}**/${score.statistics.ok}/${score.statistics.meh}/${score.statistics.miss}}`;
    if (beatmap.mode_int == "1") accValues = `{**${score.statistics.great}**/${score.statistics.ok}}/${score.statistics.miss}}`;
    if (beatmap.mode_int == "2") accValues = `{**${score.statistics.great}**/${score.statistics.ok}/${score.statistics.meh}/${score.statistics.miss}}`;
    if (beatmap.mode_int == "3") accValues = `{**${score.statistics.perfect}/${score.statistics.great}**/${score.statistics.good}/${score.statistics.ok}/${score.statistics.meh}/${score.statistics.miss}}`;

    const scoreParam = {
      mode: 0,
      mods: modsID,
    };

    const calc = new Calculator(scoreParam);

    // ss pp
    const maxAttrs = calc.performance(map);

    //normal pp
    const CurAttrs = calc.n100(score.statistics.ok).n300(score.statistics.great).n50(score.statistics.meh).nMisses(Number(score.statistics.miss)).combo(score.max_combo).nGeki(score.statistics.perfect).nKatu(score.statistics.good).performance(map);

    let grade = score.rank;
    grade = grades[grade];

    PP = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`;

    const date = new Date(score.ended_at);
    const UnixDate = date.getTime() / 1000;

    let first_row = `**#${num + 1}** ${grade} [**${score.user.username}**](https://osu.ppy.sh/users/${score.user.id}) ${modShow}**__[${CurAttrs.difficulty.stars.toFixed(2)}★]__**\n`;
    let second_row = `▹${PP} ▹ (${(score.accuracy * 100).toFixed(2)}%) • ${score.total_score.toLocaleString()}\n`;
    let third_row = `▹[ **${score.max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] • ${accValues} <t:${UnixDate}:R>`;

    if (YourScore) {
      first_row = `**#${num + 1}** ${grade} [**${score.user.username}**](https://osu.ppy.sh/users/${score.user.id}) (${(score.accuracy * 100).toFixed(2)}%) ${modShow} **${score.statistics.miss}**<:hit00:1061254490075955231> <t:${UnixDate}:R>\n`;
      second_row = `▹ ${PP} [ **${score.max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] **__[${CurAttrs.difficulty.stars.toFixed(2)}★]__**`;
      third_row = ``;
    }

    return `${first_row}${second_row}${third_row}`;
  }

  let YourScore = false;

  const things = [];
  for (const index of indices) {
    if (scores.scores[index]) {
      things.push(`${await ScoreGet(scores.scores[index], index)}\n`);
    } else {
      things.push("");
    }
  }
  if (things.length === 0) {
    things.push("**No scores found.**");
  }

  console.log(requesterName);

  user_score = "";
  if (requesterName) {
    let index = scores.scores.findIndex((x) => x.user.id == requesterName);
    if (index < -1) {
      index = scores.scores.findIndex((x) => x.user.username == requesterName);
    }
    console.log(index);
    if (index >= 0) {
      YourScore = true;
      user_score = `\n__**<@${user.id}>'s score:**__\n${await ScoreGet(scores.scores[index], index, YourScore)}`;
    }
  }

  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setTitle(`${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.version}]`) // [${starRating.difficulty.starRating.toFixed(2)}★]
    .setURL(`https://osu.ppy.sh/b/${beatmap.id}`)
    .setDescription(`${things.join("")}${user_score}`)
    .setImage(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/cover.jpg`)
    .setFooter({ text: `Page: ${pageNumber}/${totalPage}` });

  return embed;
}

module.exports = { leaderboard };
