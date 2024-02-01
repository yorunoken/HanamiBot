import { getMap } from "./database";
import { Beatmap, Calculator } from "rosu-pp";
import { mods } from "osu-api-extended";
import { DownloadEntry, DownloadStatus, Downloader } from "osu-downloader";
import type { authScope } from "../types/osu";
import type { MapAttributes, PerformanceAttributes, Score as ScoreData } from "rosu-pp";
import type { response as ScoreDetails } from "osu-api-extended/dist/types/v2_scores_details";

export function buildAuthUrl(clientId: string | number, callbackUri: string, scope: Array<authScope>, state?: string): string {
    const url = new URL("https://osu.ppy.sh/oauth/authorize");
    const params: Record<string, string> = {
        client_id: clientId.toString(),
        redirect_uri: callbackUri,
        response_type: "code",
        scope: scope.join(" "),
        state: state ?? ""
    };

    Object.keys(params)
        .forEach((key) => { url.searchParams.append(key, params[key]); });

    return url.href;
}

export async function getPerformanceResults({ play, maxCombo, hitValues }:
{ play: ScoreDetails,
    maxCombo?: number,
    hitValues: { count_100?: number, count_300?: number, count_50?: number, count_geki?: number, count_katu?: number, count_miss?: number }
}): Promise<{ mapValues: MapAttributes,
    perfectPerformance: PerformanceAttributes,
    currentPerformance: PerformanceAttributes,
    fcPerformance: PerformanceAttributes,
    mapId: number } | null> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { beatmap: map, mode_int } = play;
    const mapData = getMap(map.id)?.data ?? (await downloadBeatmap([map.id]))[0].contents;
    if (!mapData) return null;

    let { count_100: count100 = 0, count_300: count300 = 0, count_50: count50 = 0, count_geki: countGeki = 0, count_katu: countKatu = 0, count_miss: countMiss = 0 } = hitValues;
    countGeki = [2, 3].includes(mode_int) ? countGeki : 0;
    countKatu = [2, 3].includes(mode_int) ? countKatu : 0;

    const calculatorData: ScoreData = {
        mode: mode_int,
        mods: mods.id(play.mods.join(""))
    };

    const beatmap = new Beatmap({ content: mapData });
    const calculator = new Calculator(calculatorData);

    const mapValues = calculator.mapAttributes(beatmap);
    const perfectPerformance = calculator.performance(beatmap);

    const currentPerformance = calculator
        .n300(count300)
        .n100(count100)
        .n50(count50)
        .nMisses(countMiss)
        .combo(maxCombo ?? perfectPerformance.difficulty.maxCombo)
        .nGeki(countGeki)
        .nKatu(countKatu)
        .performance(beatmap);

    const fcPerformance = calculator
        .n300(count300)
        .n100(count100)
        .n50(count50)
        .nMisses(0)
        .combo(perfectPerformance.difficulty.maxCombo)
        .nGeki(countGeki)
        .nKatu(countKatu)
        .performance(beatmap);

    return { mapValues, perfectPerformance, currentPerformance, fcPerformance, mapId: map.id };
}

export async function downloadBeatmap(ids: Array<number>): Promise<Array<{
    id: string | number | undefined,
    contents: string | undefined
}>> {
    const downloader = new Downloader({
        rootPath: "./cache",
        filesPerSecond: 0,
        synchronous: true
    });
    downloader.addMultipleEntries(ids.map((id) => new DownloadEntry({ id, save: false })));

    const downloaderResponse = await downloader.downloadAll();
    if (downloaderResponse.some((item) => item.status === DownloadStatus.FailedToDownload))
        throw new Error("ERROR CODE 409, ABORTING TASK");

    return downloaderResponse.map((response) => ({ id: response.id, contents: response.buffer?.toString() }));
}
