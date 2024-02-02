import { accuracyCalculator, getPerformanceResults } from "../utils/osu";
import { grades, rulesets } from "../utils/emotes";
import type { UserBestScore, UserScore } from "osu-web.js";
import type { Modes, PlayStatistics, ScoresInfo } from "../types/osu";

// We won't be needing this either!
// interface HitValues {
//     h320: null | number;
//     h300: null | number;
//     h200: null | number;
//     h100: null | number;
//     h50: null | number;
//     hMiss: null | number;
// }

export async function getScore({ scores, index, mode }: { scores: Array<UserBestScore> | Array<UserScore>, index: number, mode: Modes }): Promise<ScoresInfo> {
    const play = scores[index];

    const { score, accuracy, beatmap, beatmapset } = play;
    const statistics = play.statistics as PlayStatistics;
    const mods = play.mods.length > 0 ? play.mods : ["NM"];

    const performance = await getPerformanceResults({ hitValues: statistics, play, maxCombo: play.max_combo, mods });

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
            const countKey = count as keyof typeof statistics;
            return statistics[countKey] ?? null;
        })
        // Filter the null values
        .filter((count) => count !== null)
        .join("/");

    const playMaxCombo = play.max_combo;
    const { maxCombo } = performance.currentPerformance.difficulty;
    const isFc = statistics.count_miss === 0 || playMaxCombo + 7 >= maxCombo;

    let ifFcValues = null;
    if (!isFc) {
        const fcAccuracy = accuracyCalculator(mode, statistics);
        ifFcValues = `FC: **${performance.fcPerformance.pp.toFixed(2).toLocaleString()}pp** for **${fcAccuracy.toFixed(2)}%**`;
    }

    const drainLengthInSeconds = beatmap.total_length / performance.mapValues.clockRate;
    const drainMinutes = Math.floor(drainLengthInSeconds / 60);

    // I thought Math.ceil would do a better job here since if the seconds is gonna be like, 40.88,
    // Instead of rounding it down to 40, it would make more sense to round it to 41.
    const drainSeconds = Math.ceil(drainLengthInSeconds % 60);

    return {
        songTitle: `${beatmapset.artist} - ${beatmapset.title}`,
        difficultyName: beatmap.version,
        score: score.toLocaleString(),
        accuracy: accuracy.toFixed(2),
        mapLink: `https://osu.ppy.sh/b/${beatmap.id}`,
        coverLink: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/list.jpg`,
        grade: grades[play.rank],
        hitValues: `{ ${hitValues} }`, // Returns the value in this format: 433/12/2/4
        mods,
        drainLength: `${drainMinutes}:${drainSeconds}`,
        stars: `${performance.currentPerformance.difficulty.stars.toFixed(2).toLocaleString()}★`,
        rulesetEmote: rulesets[mode],
        ppFormatted: `**${performance.currentPerformance.pp.toFixed(2).toLocaleString()}**/${performance.perfectPerformance.pp.toFixed(2).toLocaleLowerCase()}pp`,
        playSubmitted: `<t:${new Date(play.created_at).getTime() / 1000}:R>`,
        ifFcValues,
        comboValues: `[ **${playMaxCombo.toLocaleString()}**/${maxCombo.toLocaleString()}x ]`,
        performance
    };
}

