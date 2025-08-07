import { accuracyCalculator, getPerformanceResults, getRetryCount, hitValueCalculator } from "@utils/osu";
import { grades, rulesets } from "@utils/constants";
import { insertData } from "@utils/database";
import { Tables } from "@type/database";
import type { Mode, UserScore, Beatmap, LeaderboardScore, ScoresInfo, Score, UserBestScore, UserBestScoreV2, UserScoreV2, ScoreV2 } from "@type/osu";
import type { ISOTimestamp, ScoreStatistics } from "osu-web.js";

// We won't be needing this either!
// interface HitValues {
//     h320: null | number;
//     h300: null | number;
//     h200: null | number;
//     h100: null | number;
//     h50: null | number;
//     hMiss: null | number;
// }

export async function getProcessedScore({
    scores,
    beatmap: map_,
    index,
    mode,
    mapData,
}: {
    scores: Array<UserBestScore | UserBestScoreV2 | UserScore | UserScoreV2 | Score | ScoreV2 | LeaderboardScore>;
    beatmap?: Beatmap;
    index: number;
    mode: Mode;
    mapData?: string;
}): Promise<ScoresInfo> {
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
    let scoreStatistics: ScoreStatistics;
    let user: string | undefined;
    let userId: number | undefined;
    let retries: number | undefined;

    if ("beatmap" in play) {
        const beatmapIds = [];
        for (let i = index; i < scores.length; i++) {
            const score = scores[i];
            if ("beatmap" in score) beatmapIds.push(score.beatmap.id);
        }
        retries = getRetryCount(beatmapIds, play.beatmap.id);
    }

    console.log(play);

    if ("score" in play) {
        totalScore = play.score;
        createdAt = play.created_at;
        scoreStatistics = play.statistics;
    } else {
        // Handle V2 and leaderboard scores
        if ("user" in play && play.user) {
            user = play.user.username;
            userId = play.user_id;
        }
        totalScore = play.total_score;
        createdAt = play.ended_at;

        scoreStatistics = {
            count_300: play.statistics.great ?? 0,
            count_100: play.statistics.ok ?? 0,
            count_50: play.statistics.meh ?? 0,
            count_geki: play.statistics.perfect ?? 0,
            count_katu: play.statistics.good ?? 0,
            count_miss: play.statistics.miss ?? 0,
        };
    }

    const performance = await getPerformanceResults({
        hitValues: scoreStatistics,
        beatmapId: beatmap.id,
        play: play as any,
        maxCombo: play.max_combo,
        mods: play.mods as any,
        mapData,
    });

    // Throw an error if performance doesn't exist.
    // This can only mean one thing, and it's because the map couldn't be downloaded for some reason.
    if (!performance) throw new Error("Scores.ts panicked!", { cause: "`performanece` doesn't exist, presumably because the map couldn't be downloaded." });
    const { fc, current, difficultyAttrs, perfect, mapValues } = performance;

    if (play.passed && "score" in play) {
        insertData(
            {
                table: Tables.PP,
                id: play.id,
                data: [
                    {
                        key: "pp",
                        value: current.pp,
                    },
                    {
                        key: "pp_fc",
                        value: fc.pp,
                    },
                    {
                        key: "pp_perfect",
                        value: perfect.pp,
                    },
                ],
            },
            true,
        );
    }

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

    const hitValues = hitValueCalculator(mode, scoreStatistics);

    const playMaxCombo = play.max_combo;
    const { maxCombo } = current.difficulty;
    const isFc = scoreStatistics.count_miss === 0 && playMaxCombo + 7 >= maxCombo;

    // set value to null because we won't always need it.
    let ifFcHanami: string | null = null;
    let ifFcBathbot: string | null = null;
    let ifFcOwo: string | null = null;
    let fcAccuracy: number | null = null;

    let fcStatistics: null | {
        count_300?: number;
        count_miss?: number;
        count_100?: number;
        count_50?: number;
        count_geki?: number;
        count_katu?: number;
    } = null;

    if (!isFc) {
        fcStatistics = {
            count_300: fc.state?.n300,
            count_100: fc.state?.n100,
            count_50: fc.state?.n50,
            count_miss: fc.state?.misses,
            count_geki: fc.state?.nGeki,
            count_katu: fc.state?.nKatu,
        };

        fcAccuracy = accuracyCalculator(mode, fcStatistics);
        ifFcHanami = `FC: **${fc.pp.toFixed(2).toLocaleString()}pp** for **${fcAccuracy.toFixed(2)}%**`;
        ifFcBathbot = `**${fc.pp.toFixed(2).toLocaleString()}**/${perfect.pp.toFixed(2).toLocaleString()}PP`;
        ifFcOwo = `(${fc.pp.toFixed(2).toLocaleString()}PP for ${fcAccuracy.toFixed(2)}% FC)`;
    }

    const fcHitValues = hitValueCalculator(mode, fcStatistics);

    // Get beatmap's drain length
    const drainLengthInSeconds = beatmap.total_length / difficultyAttrs.clockRate;
    const drainMinutes = Math.floor(drainLengthInSeconds / 60);

    // I thought Math.ceil would do a better job here since if the seconds is gonna be like, 40.88,
    // Instead of rounding it down to 40, it would make more sense to round it to 41.
    const drainSeconds = Math.ceil(drainLengthInSeconds % 60);

    const objectsHit = (scoreStatistics.count_300 ?? 0) + (scoreStatistics.count_100 ?? 0) + (scoreStatistics.count_50 ?? 0) + scoreStatistics.count_miss;
    const objects = mapValues.nObjects;

    const percentageNum = (objectsHit / objects) * 100;
    const beatmapStatus = beatmapset.status;

    return {
        user,
        userId,
        retries,
        position: play.position ?? index + 1,
        percentagePassed: percentageNum === 100 || play.passed ? null : percentageNum.toFixed(1),
        songNameFormatted: `${beatmapset.artist} - ${beatmapset.title}`,
        songArtist: beatmapset.artist,
        songName: beatmapset.title,
        difficultyName: beatmap.version,
        score: totalScore.toLocaleString(),
        accuracy: (play.accuracy * 100).toFixed(2),
        mapLink: `https://osu.ppy.sh/b/${beatmap.id}`,
        coverLink: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/cover.jpg`,
        listLink: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/list.jpg`,
        thumbLink: `https://b.ppy.sh/thumb/${beatmapset.id}l.jpg`,
        grade: grades[play.rank],
        hitValues, // Returns the value in this format: { 433/12/2/4 }
        fcHitValues,
        fcAccuracy: fcAccuracy?.toFixed(2),
        isFc,
        mods: performance.mods,
        mapAuthor: beatmapset.creator,
        mapStatus: beatmapStatus.charAt(0).toUpperCase() + beatmapStatus.slice(1),
        drainLength: `${drainMinutes}:${drainSeconds < 10 ? `0${drainSeconds}` : drainSeconds}`,
        stars: `${current.difficulty.stars.toFixed(2).toLocaleString()}★`,
        rulesetEmote: rulesets[mode],
        pp: current.pp,
        ppFormatted: `**${current.pp.toFixed(2).toLocaleString()}**/${perfect.pp.toFixed(2).toLocaleLowerCase()}pp`,
        playSubmitted: `<t:${new Date(createdAt).getTime() / 1000}:R>`,
        ifFcHanami,
        ifFcBathbot,
        ifFcOwo,
        comboValues: `**${playMaxCombo.toLocaleString()}**/${maxCombo.toLocaleString()}x`,
        performance,
    };
}
