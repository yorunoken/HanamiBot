import { getPerformanceResults } from "../utils/osu";
import type { Modes } from "../types/osu";
import type { response as Score } from "osu-api-extended/dist/types/v2_scores_details";

interface HitValues {
    h320: null | number;
    h300: null | number;
    h200: null | number;
    h100: null | number;
    h50: null | number;
    hMiss: null | number;
}

export async function getScore({ scores, index, mode, getPerformance }: { scores: Array<Score>, index: number, mode: Modes, getPerformance: boolean }) {
    const play = scores[index];

    const { score, accuracy, statistics, beatmap } = play;

    let performance;
    if (getPerformance)
        performance = await getPerformanceResults({ hitValues: statistics, play, maxCombo: play.max_combo });

    const hitValues: HitValues = {
        h320: null,
        h300: null,
        h200: null,
        h100: null,
        h50: null,
        hMiss: null
    };

    switch (mode) {
        case "osu":
            hitValues.h300 = statistics.count_300;
            hitValues.h100 = statistics.count_100;
            hitValues.h50 = statistics.count_50;
            hitValues.hMiss = statistics.count_miss;
            break;
        case "mania":
            hitValues.h320 = statistics.count_geki;
            hitValues.h300 = statistics.count_300;
            hitValues.h200 = statistics.count_katu;
            hitValues.h100 = statistics.count_100;
            hitValues.h50 = statistics.count_50;
            hitValues.hMiss = statistics.count_miss;
            break;
        case "taiko":
            hitValues.h300 = statistics.count_300;
            hitValues.h100 = statistics.count_100;
            hitValues.hMiss = statistics.count_miss;
            break;
        case "fruits":
            hitValues.h300 = statistics.count_300;
            hitValues.h100 = statistics.count_100;
            hitValues.hMiss = statistics.count_miss;
            break;
    }

    return {
        globalScore: score.toLocaleString(),
        accuracy: accuracy.toFixed(),
        mapLink: `https://osu.ppy.sh/b/${beatmap.id}`,
        hitValues: Object.values(hitValues).join("/")

    };
}
