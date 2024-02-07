/* eslint-disable @stylistic/no-mixed-operators */
import { Mode } from "../types/osu";
import { getMap, insertData } from "./database";
import { Beatmap, Calculator } from "rosu-pp";
import { DownloadEntry, DownloadStatus, Downloader } from "osu-downloader";
import { getModsEnum } from "osu-web.js";
import type { AccessTokenJSON, AuthScope, PerformanceInfo } from "../types/osu";
import type { Mod, UserBestScore, UserScore } from "osu-web.js";
import type { Score as ScoreData } from "rosu-pp";

/**
 * Build OAuth authorization URL for osu! using the provided parameters.
 * @param clientId - Client ID for the application.
 * @param callbackUri - Redirect URI where the authorization code will be sent.
 * @param scope - Array of authorization scopes.
 * @param state - Optional parameter for preserving state between the request and callback.
 * @returns Fully constructed authorization URL.
 */
export function buildAuthUrl(clientId: string | number, callbackUri: string, scope: Array<AuthScope>, state?: string): string {
    // Create a new URL to later append parameters.
    const url = new URL("https://osu.ppy.sh/oauth/authorize");

    // Initialize parameters
    const params: Record<string, string> = {
        client_id: clientId.toString(),
        redirect_uri: callbackUri,
        response_type: "code",
        scope: scope.join(" "),
        state: state ?? ""
    };

    // Append parameters to URL.
    for (const [key, value] of Object.entries(params)) url.searchParams.append(key, value);

    return url.href;
}

/**
 * Gets the access token of the client.
 * @param clientId - Client ID for the application.
 * @param clientSecret - Client Secret for the application.
 * @param scope - Array of authorization scopes.
 * @returns An object containing the access token and its expiration date.
 */
export async function getAccessToken(clientId: number, clientSecret: string, scope: Array<AuthScope>):
Promise<{
    accessToken: string,
    expiresIn: string
}> {
    const body = JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: scope.join(" "),
        code: "code"
    });

    const request = await fetch("https://osu.ppy.sh/oauth/token", {
        method: "POST",
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json"
        },
        body
    });
    if (!request.ok) throw new Error("Couldn't GET access token");
    const data = await request.json() as AccessTokenJSON;

    return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function getPerformanceResults({ play, maxCombo, hitValues, mods }:
{ play: UserBestScore | UserScore,
    maxCombo?: number,
    hitValues: { count_100?: number, count_300?: number, count_50?: number, count_geki?: number, count_katu?: number, count_miss?: number },
    mods: Array<Mod>
}): Promise<PerformanceInfo | null> {
    const { beatmap: map, mode_int: rulesetId } = play;
    const mapData = getMap(map.id)?.data ?? (await downloadBeatmap([map.id]))[0].contents;
    if (!mapData) return null;

    let { count_100: count100 = 0, count_300: count300 = 0, count_50: count50 = 0, count_geki: countGeki = 0, count_katu: countKatu = 0, count_miss: countMiss = 0 } = hitValues;
    countGeki = [2, 3].includes(rulesetId) ? countGeki : 0;
    countKatu = [2, 3].includes(rulesetId) ? countKatu : 0;

    const calculatorData: ScoreData = {
        mode: rulesetId,
        mods: getModsEnum(mods)
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

    for (const downloaded of downloaderResponse) insertData({ table: "maps", id: downloaded.id ?? 0, data: [ { name: "data", value: downloaded.buffer?.toString() ?? "" } ] });

    return downloaderResponse.map((response) => ({ id: response.id, contents: response.buffer?.toString() }));
}

export function accuracyCalculator(mode: Mode, hits: {
    count_300?: number,
    count_100?: number,
    count_50?: number,
    count_miss?: number,
    count_geki?: number,
    count_katu?: number
}): number {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { count_100 = 0, count_300 = 0, count_50 = 0, count_geki = 0, count_katu = 0, count_miss = 0 } = hits;

    let acc = 0.0;

    switch (mode) {
        case Mode.OSU: acc = (6 * count_300 + 2 * count_100 + count_50) / (6 * (count_50 + count_100 + count_300 + count_miss)); break;
        case Mode.TAIKO: acc = (2 * count_300 + count_100) / (2 * (count_300 + count_100 + count_miss)); break;
        case Mode.FRUITS: acc = count_300 + count_100 + count_50 + count_katu + count_miss; break;
        case Mode.MANIA: acc = (6 * count_geki + 6 * count_300 + 4 * count_katu + 2 * count_100 + count_50) / (6 * (count_50 + count_100 + count_300 + count_miss + count_geki + count_katu)); break;
    }

    return 100 * acc;
}

