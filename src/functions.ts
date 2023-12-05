import { tools, v2 } from "osu-api-extended";
import { response as BeatmapResponse } from "osu-api-extended/dist/types/v2_beatmap_id_details";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { response as UserOsu } from "osu-api-extended/dist/types/v2_user_details";
import { BeatmapInfo, Locales, osuModes, ScoreInfo, UserInfo } from "./Structure/index";
import { downloadMap, formatNumber, getPerformanceDetails, getRetryCount, grades, insertData, osuEmojis, rulesets } from "./utils";

export function getUser({ user, mode, locale }: { user: UserOsu; mode: osuModes; locale: Locales }): UserInfo {
  const stats = user.statistics;
  const userJoinDate = new Date(user.join_date);

  return {
    username: user.username,
    userCover: user.cover_url,
    userAvatar: user.avatar_url,
    userUrl: `https://osu.ppy.sh/users/${user.id}/${mode}`,
    coverUrl: user.cover_url,
    userFlag: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
    countryCode: user.country.code,
    globalRank: stats.global_rank?.toLocaleString() || "-",
    countryRank: stats.country_rank?.toLocaleString() || "-",
    pp: stats.pp.toLocaleString(),
    rankedScore: stats.ranked_score.toLocaleString(),
    totalScore: stats.total_score.toLocaleString(),
    objectsHit: stats.total_hits.toLocaleString(),
    occupation: `**${locale.classes.occupation}:**\n \`${user.occupation}\`\n` || "",
    interest: `**${locale.classes.interests}:**\n \`${user.interests}\`\n` || "",
    location: `**${locale.classes.location}:**\n \`${user.location}\`` || "",
    highestRank: user.rank_highest?.rank.toLocaleString() || undefined,
    highestRankTime: user.rank_highest ? new Date(user.rank_highest.updated_at).getTime() / 1000 : undefined,
    recommendedStarRating: (Math.pow(stats.pp, 0.4) * 0.195).toFixed(2),
    userJoinedAgo: (Math.floor((Date.now() - userJoinDate.valueOf()) / (1000 * 60 * 60 * 24 * 30)) / 12).toFixed(1),
    formattedDate: userJoinDate.toLocaleDateString(locale.code, {
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    }),
    accuracy: stats.hit_accuracy.toFixed(2),
    level: `${user.statistics.level.current}.${stats.level.progress.toString(10).padStart(2, "0")}`,
    playCount: stats.play_count.toLocaleString(),
    playHours: (stats.play_time / 3600).toFixed(0),
    followers: user.follower_count.toLocaleString(),
    maxCombo: stats.maximum_combo.toLocaleString(),
    rankS: stats.grade_counts.s.toLocaleString(),
    rankA: stats.grade_counts.a.toLocaleString(),
    rankSs: stats.grade_counts.ss.toLocaleString(),
    rankSh: stats.grade_counts.sh.toLocaleString(),
    rankSsh: stats.grade_counts.ssh.toLocaleString(),
    emoteA: grades.A,
    emoteS: grades.S,
    emoteSh: grades.SH,
    emoteSs: grades.X,
    emoteSsh: grades.XH,
  };
}

export async function getScore({ plays, index, mode, _isTops, isCompare, perfDetails, beatmap, file, locale }: { plays: ScoreResponse[]; index: number; mode: osuModes; _isTops?: boolean; isCompare?: boolean; perfDetails?: any; beatmap?: BeatmapResponse; file?: string; locale: Locales }): Promise<ScoreInfo> {
  const play = plays[index];
  const rulesetId = rulesets[mode];

  (play.beatmap as any) = isCompare ? beatmap : play.beatmap;
  (play.beatmapset as any) = isCompare ? beatmap?.beatmapset : play.beatmapset;

  if (!file || !["ranked", "loved", "approved"].includes(play.beatmap.status)) {
    file = (await downloadMap(play.beatmap.id)) as string;
    insertData({ table: "maps", id: play.beatmap.id.toString(), data: file });
  }

  const { id: beatmapId, count_circles, count_sliders, count_spinners, hit_length, version } = play.beatmap;
  const { user_id: creatorId, creator: creatorUsername, status: mapStatus, id: mapsetId, artist, title } = play.beatmapset;
  const { count_100, count_300, count_50, count_geki, count_katu, count_miss } = play.statistics;

  const objectshit = count_300 + count_100 + count_50 + count_miss;
  const objects = count_circles + count_sliders + count_spinners;
  const percentageNum = Number((objectshit / objects) * 100);

  const modsPlay = play.mods.length > 0 ? `**+${play.mods.join("").toUpperCase()}**` : "**+NM**";

  let hitLength = play.beatmap.hit_length;
  let totalLength = play.beatmap.hit_length;
  if (modsPlay.toLowerCase().includes("dt")) {
    hitLength = hitLength! / 1.5;
    totalLength = totalLength! / 1.5;
  }

  const performance = getPerformanceDetails({
    modsArg: play.mods,
    maxCombo: play.max_combo,
    rulesetId,
    hitValues: {
      count_100,
      count_300,
      count_50,
      count_geki,
      count_katu,
      count_miss,
    },
    mapText: file,
  });

  let globalPlacement = "";
  if (play.passed && play.best_id) {
    const scoreGlobal = await v2.scores.details(play.best_id, mode);
    if (scoreGlobal && scoreGlobal.rank_global < 10000) {
      globalPlacement = `**__${locale.classes.globalRank} #${scoreGlobal.rank_global}:__**`;
    }
  }

  return {
    performance,
    retries: isCompare ? undefined : getRetryCount(plays.map((x) => x.beatmap.id).splice(index, plays.length), beatmapId),
    percentagePassed: percentageNum === 100 || play.passed == true ? "" : `@${percentageNum.toFixed(1)}% `,
    modsPlay,
    beatmapId,
    globalPlacement,
    countCircles: count_circles,
    countSliders: count_sliders,
    countSpinners: count_spinners,
    hitLength: hit_length,
    placement: play.position,
    version: version,
    creatorId: creatorId,
    creatorUsername: creatorUsername,
    mapStatus: locale.embeds.map[mapStatus as "ranked" | "qualified" | "loved" | "pending" | "graveyard"],
    mapsetId: mapsetId,
    count100: count_100,
    count300: count_300,
    count50: count_50,
    countGeki: count_geki,
    countKatu: count_katu,
    countMiss: count_miss,
    totalScore: play.score.toLocaleString(),
    accuracy: `${Number(play.accuracy * 100).toFixed(2)}%`,
    artist: artist,
    title: title,
    grade: grades[play.rank],
    submittedTime: new Date(play.created_at).getTime() / 1000,
    minutesTotal: Math.floor(totalLength! / 60).toFixed(),
    secondsTotal: (totalLength! % 60).toFixed().toString().padStart(2, "0"),
    bpm: performance.mapValues.bpm.toFixed(),
    mapValues: `AR: ${formatNumber(performance.mapValues.ar, 1)} OD: ${formatNumber(performance.mapValues.od, 1)} CS: ${formatNumber(performance.mapValues.cs, 1)} HP: ${formatNumber(performance.mapValues.hp, 2)}`,
    stars: performance.maxPerf.difficulty.stars.toFixed(2),
    accValues: `{ **${rulesetId === 3 ? count_geki + "/" : ""}${count_300}**/${rulesetId === 3 ? count_katu + "/" : ""}${count_100}/${rulesetId === 1 ? "" : count_50 + "/"}${count_miss} }`,
    comboValue: `[ **${play.max_combo}**x/${performance.maxPerf.difficulty.maxCombo}x ]`,
    pp: performance.curPerf?.pp.toFixed(2),
    fcPp: performance.fcPerf.pp.toFixed(2),
    ssPp: performance.maxPerf.pp.toFixed(2),
    totalResult: `**${performance.curPerf?.pp.toFixed(2)}**/${performance.maxPerf.pp.toFixed(2)}pp • ${play.max_combo}x/${performance.maxPerf.difficulty.maxCombo}x • { **${rulesetId === 3 ? count_geki + "/" : ""}${count_300}**/${rulesetId === 3 ? count_katu + "/" : ""}${count_100}/${rulesetId === 1 ? "" : count_50 + "/"}${count_miss} }`,
    ifFcValue: (performance.curPerf as any).effectiveMissCount > 0
      ? locale.classes.ifFc(
        `**${
          tools
            .accuracy(
              {
                300: (objects - count_100 - count_50).toString(),
                geki: count_geki.toString(),
                100: count_100.toString(),
                katu: count_katu.toString(),
                50: count_50.toString(),
                0: "0",
              },
              mode,
            )
            .toFixed(2)
        }%**`,
        `**${performance.fcPerf.pp.toFixed(2)}**`,
      )
      : "",
  };
}

export async function getBeatmap(map: BeatmapResponse, valueOptions: { mods: string[]; accuracy?: number; ar?: number; od?: number; cs?: number }, file: string, locale: Locales): Promise<BeatmapInfo> {
  const set = map.beatmapset;
  const rulesetId = rulesets[map.mode];

  const performance: Record<number, ReturnType<typeof getPerformanceDetails>> = {};
  [100, 99, 98, 95].forEach((accuracy) => {
    performance[accuracy] = getPerformanceDetails({
      modsArg: valueOptions.mods,
      maxCombo: map.max_combo,
      rulesetId: rulesetId,
      hitValues: {},
      accuracy: accuracy,
      mapText: file,
    });
  });

  const mods = "+" + valueOptions.mods.join("");

  const totalLength = ["DT", "NC"].includes(mods.toUpperCase()) ? map.hit_length / 1.5 : map.hit_length;

  return {
    title: set.title,
    artist: set.artist,
    version: map.version,
    mode: map.mode,
    id: map.id,
    setId: map.beatmapset_id,
    creator: map.beatmapset.creator,
    rulesetId: rulesetId,
    totalObjects: map.count_circles + map.count_sliders + map.count_spinners,
    stars: performance[100].maxPerf.difficulty.stars.toFixed(2),
    mods,
    bpm: performance[100].mapValues.bpm.toFixed(),
    totalLength,
    mapLength: `${Math.floor(totalLength / 60).toFixed()}:${(totalLength % 60).toFixed().toString().padStart(2, "0")}`,
    maxCombo: map.max_combo,
    ar: ["taiko", "mania"].includes(map.mode) ? "-" : performance[100].mapValues.ar.toFixed(1),
    od: performance[100].mapValues.od.toFixed(1),
    hp: performance[100].mapValues.hp.toFixed(1),
    cs: ["taiko", "mania"].includes(map.mode) ? "-" : performance[100].mapValues.ar.toFixed(2),
    favorited: map.beatmapset.favourite_count.toLocaleString(),
    playCount: map.beatmapset.play_count.toLocaleString(),
    ppValues: `\`\`\`Acc | PP\n100%: ${performance[100].fcPerf.pp.toFixed()}pp\n99%:  ${performance[99].fcPerf.pp.toFixed()}pp\n98%:  ${performance[98].fcPerf.pp.toFixed()}pp\n95%:  ${performance[95].fcPerf.pp.toFixed()}pp\`\`\``,
    links:
      `<:chimu:1117792339549761576>[Chimu](https://chimu.moe/d/${map.beatmapset_id})\n<:beatconnect:1075915329512931469>[Beatconnect](https://beatconnect.io/b/${map.beatmapset_id})\n:notes:[${locale.classes.songPreview}](https://b.ppy.sh/preview/${map.beatmapset_id}.mp3)\n🎬[${locale.classes.mapPreview}](https://osu.pages.dev/preview#${map.id})\n🖼️[${locale.classes.fullBackground}](https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/raw.jpg)`,
    background: `https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/cover.jpg`,

    updatedAt: `${locale.classes[map.status as "ranked" | "qualified" | "loved"]} ${
      new Date(map.last_updated).toLocaleDateString(locale.code, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }`,
    modeEmoji: osuEmojis[map.mode],
  };
}
