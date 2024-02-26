import { accuracyCalculator, getPerformanceResults, getRetryCount } from "../utils/osu";
import { grades, rulesets } from "../utils/emotes";
import type { UserScore, Beatmap, LeaderboardScores, Mode, PlayStatistics, ScoresInfo, Score, UserBestScore } from "../types/osu";
import type { ISOTimestamp } from "osu-web.js";

// We won't be needing this either!
// interface HitValues {
//     h320: null | number;
//     h300: null | number;
//     h200: null | number;
//     h100: null | number;
//     h50: null | number;
//     hMiss: null | number;
// }

export async function getScore({ scores, beatmap: map_, index, mode, mapData }:
{ scores: Array<UserBestScore> | Array<UserScore> | Array<Score> | Array<LeaderboardScores>, beatmap?: Beatmap, index: number, mode: Mode, mapData?: string }): Promise<ScoresInfo> {
    const play = scores[index];

    let beatmap;
    let beatmapset;
    if (map_) {
        const { beatmapset: mapset, ...rest } = map_;
        beatmap = { ...rest };
        beatmapset = mapset;
    } else {
        const { beatmap: map, beatmapset: set } = play as UserBestScore | UserScore;
        beatmap = map;
        beatmapset = set;
    }

    let totalScore: number;
    let createdAt: ISOTimestamp;
    let scoreStatistics: PlayStatistics;
    let user: string | undefined;
    let userId: number | undefined;
    let retries: number | undefined;

    if ("beatmap" in play) {
        retries = getRetryCount(
            scores.map((x) => {
                if ("beatmap" in x)
                    return x.beatmap.id;
                return 0;
            }).splice(index, scores.length),
            play.beatmap.id
        );
    }

    if ("score" in play) {
        totalScore = play.score;
        createdAt = play.created_at;
        scoreStatistics = play.statistics;
    } else {
        user = play.user.username;
        userId = play.user_id;
        totalScore = play.total_score;
        createdAt = play.ended_at;
        scoreStatistics = {
            count_50: play.statistics.meh ?? 0,
            count_100: play.statistics.good ?? 0,
            count_300: play.statistics.great ?? 0,
            count_geki: play.statistics.perfect ?? 0,
            count_katu: play.statistics.ok ?? 0,
            count_miss: play.statistics.miss ?? 0
        };
    }

    const performance = await getPerformanceResults({ hitValues: scoreStatistics, beatmapId: beatmap.id, play, maxCombo: play.max_combo, mods: play.mods, mapData });

    // Throw an error if performance doesn't exist.
    // This can only mean one thing, and it's because the map couldn't be downloaded for some reason.
    if (!performance) throw new Error("Scores.ts panicked!", { cause: "`performanece` doesn't exist, presumably because the map couldn't be downloaded." });

    // We won't be needing this anymore, since osu! API now returns _null_ if the statistic key is not a part of the gamemode!
    // I'm not deleting the code in case I need it in the future if they decide to revert.
    // const hitValues: HitValues = {
    //     h320: null,
    //     h300: null,
    //     h200: null,
    //     h100: null,
    //     h50: null,
    //     hMiss: null
    // };

    // const modeMappings: Record<string, Array<keyof HitValues>> = {
    //     osu: ["h300", "h100", "h50", "hMiss"],
    //     mania: ["h320", "h300", "h200", "h100", "h50", "hMiss"],
    //     taiko: ["h300", "h100", "hMiss"],
    //     fruits: ["h300", "h100", "hMiss"]
    // };

    // const modeKeys = modeMappings[mode];
    // modeKeys.forEach((key) => {
    //     const countKey = `count_${key.slice(1)}` as keyof typeof statistics;
    //     hitValues[key] = statistics[countKey];
    // });

    // The order of hit values
    const order = ["count_geki", "count_300", "count_katu", "count_100", "count_50", "count_miss"];
    // Map over the keys of the order object
    const hitValues = order
        .map((count) => {
            // Cast the count key to a keyof typeof statistics to ensure type safety
            const countKey = count as keyof typeof scoreStatistics;
            return scoreStatistics[countKey] ?? null;
        })
        // Filter the null values
        .filter((count) => count !== null)
        .join("/");

    const playMaxCombo = play.max_combo;
    const { maxCombo } = performance.currentPerformance.difficulty;
    const isFc = scoreStatistics.count_miss === 0 && playMaxCombo + 7 >= maxCombo;

    // set fcValues to null because we won't always need it.
    let ifFcValues = null;
    if (!isFc) {
        const fcAccuracy = accuracyCalculator(mode, scoreStatistics);
        ifFcValues = `FC: **${performance.fcPerformance.pp.toFixed(2).toLocaleString()}pp** for **${fcAccuracy.toFixed(2)}%**`;
    }

    // Get beatmap's drain length
    const drainLengthInSeconds = beatmap.total_length / performance.mapValues.clockRate;
    const drainMinutes = Math.floor(drainLengthInSeconds / 60);

    // I thought Math.ceil would do a better job here since if the seconds is gonna be like, 40.88,
    // Instead of rounding it down to 40, it would make more sense to round it to 41.
    const drainSeconds = Math.ceil(drainLengthInSeconds % 60);

    const objectshit = (scoreStatistics.count_300 ?? 0) + (scoreStatistics.count_100 ?? 0) + (scoreStatistics.count_50 ?? 0) + scoreStatistics.count_miss;
    const objects = performance.mapValues.nCircles + performance.mapValues.nSliders + performance.mapValues.nSpinners;
    const percentageNum = objectshit / objects * 100;

    const beatmapStatus = beatmapset.status;

    return {
        user,
        userId,
        retries,
        position: play.position ?? index + 1,
        percentagePassed: percentageNum === 100 || play.passed ? null : percentageNum.toFixed(1),
        songTitle: `${beatmapset.artist} - ${beatmapset.title}`,
        songArtist: beatmapset.artist,
        songName: beatmapset.title,
        difficultyName: beatmap.version,
        score: totalScore.toLocaleString(),
        accuracy: (play.accuracy * 100).toFixed(2),
        mapLink: `https://osu.ppy.sh/b/${beatmap.id}`,
        coverLink: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/cover.jpg`,
        listLink: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/list.jpg`,
        grade: grades[play.rank],
        hitValues: `{ ${hitValues} }`, // Returns the value in this format: { 433/12/2/4 }
        mods: performance.mods,
        mapAuthor: beatmapset.creator,
        mapStatus: beatmapStatus.charAt(0).toUpperCase() + beatmapStatus.slice(1),
        drainLength: `${drainMinutes}:${drainSeconds}`,
        stars: `${performance.currentPerformance.difficulty.stars.toFixed(2).toLocaleString()}★`,
        rulesetEmote: rulesets[mode],
        ppFormatted: `**${performance.currentPerformance.pp.toFixed(2).toLocaleString()}**/${performance.perfectPerformance.pp.toFixed(2).toLocaleLowerCase()}pp`,
        playSubmitted: `<t:${new Date(createdAt).getTime() / 1000}:R>`,
        ifFcValues,
        comboValues: `[ **${playMaxCombo.toLocaleString()}**/${maxCombo.toLocaleString()}x ]`,
        performance
    };
}

