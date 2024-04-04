import type { Mod } from "./mods";
import type { UserScore as UserScore_, Beatmapset, Score as Score_, Fails, Beatmap as BeatmapWeb, Country, Cover, UserCompact, Rank, ISOTimestamp, UserBestScore as UserBestScore_ } from "osu-web.js";
import type { Beatmap as BeatmapRosu, BeatmapAttributes, PerformanceAttributes } from "rosu-pp-js";

export const enum Mode {
    OSU = "osu",
    MANIA = "mania",
    TAIKO = "taiko",
    FRUITS = "fruits"
}

export const enum PlayType {
    BEST = "best",
    RECENT = "recent",
    FIRSTS = "firsts"
}

export interface ProfileInfo {
    username: string;
    userCover: string;
    avatarUrl: string;
    userUrl: string;
    bannerUrl: string;
    flagUrl: string;
    countryCode: string;
    globalRank: string;
    countryRank: string;
    peakGlobalRank: string;
    peakGlobalRankTime: number;
    pp: string;
    stockValue: number | undefined;
    stockUpdated: number | undefined;
    rankedScore: string;
    totalScore: string;
    objectsHit: string;
    occupation: string | null;
    interest: string | null;
    location: string | null;
    recommendedStarRating: string;
    joinedAgo: string;
    joinedAt: string;
    accuracy: string;
    level: string;
    playCount: string;
    playHours: string;
    followers: string;
    maxCombo: string;
    rankS: string;
    rankA: string;
    rankSs: string;
    rankSh: string;
    rankSsh: string;
}

export interface ScoresInfo {
    position: number;
    songTitle: string;
    songArtist: string;
    songName: string;
    retries: number | undefined;
    percentagePassed: string | null;
    difficultyName: string;
    score: string;
    accuracy: string;
    mapLink: string;
    coverLink: string;
    listLink: string;
    grade: string;
    hitValues: string;
    fcHitValues: string;
    fcAccuracy: string | undefined;
    isFc: boolean;
    mapAuthor: string;
    mapStatus: string;
    mods: Array<string>;
    drainLength: string;
    stars: string;
    rulesetEmote: string;
    ppFormatted: string;
    playSubmitted: string;
    ifFcHanami: string | null;
    ifFcBathbot: string | null;
    comboValues: string;
    performance: PerformanceInfo;
    user: string | undefined;
    userId: number | undefined;
}

export interface PerformanceInfo {
    mapValues: BeatmapRosu;
    difficultyAttrs: BeatmapAttributes;
    perfectPerformance: PerformanceAttributes;
    currentPerformance: PerformanceAttributes;
    fcPerformance: PerformanceAttributes;
    mapId: number;
    mods: Array<string>;
}

export type AuthScope = "public" | "chat.write" | "delegate" | "forum.write" | "friends.read" | "identify";

export interface AccessTokenJSON {
    access_token: string;
    expires_in: string;
}

export interface PlayStatistics {
    count_100: number | null;
    count_300: number | null;
    count_50: number | null;
    count_geki: number | null;
    count_katu: number | null;
    count_miss: number;
}

export interface LeaderboardScore {
    position?: number;
    ranked: boolean;
    preserve: boolean;
    maximum_statistics: {
        great: number,
        legacy_combo_increase: number
    };
    mods: Array<Mod>;
    statistics: {
        ok?: number,
        great?: number,
        meh?: number,
        miss?: number,
        perfect?: number,
        good?: number
    };
    beatmap_id: number;
    best_id: number | null;
    id: number;
    rank: Rank;
    type: string;
    user_id: number;
    accuracy: number;
    build_id: number | null;
    ended_at: ISOTimestamp;
    has_replay: boolean;
    is_perfect_combo: boolean;
    legacy_perfect: boolean;
    legacy_score_id: number;
    legacy_total_score: number;
    max_combo: number;
    passed: boolean;
    pp: number;
    ruleset_id: 0 | 1 | 2 | 3;
    started_at: string | null;
    total_score: number;
    replay: boolean;
    current_user_attributes: {
        pin: number | null
    } | null;

}

export type Beatmap = BeatmapWeb & {
    beatmapset: Beatmapset & {
        ratings: Array<number>
    },
    checksum: string | null,
    failtimes: Fails,
    max_combo: number
};

export type LeaderboardScores = LeaderboardScore & {
    user: UserCompact & {
        country: Country,
        cover: Cover
    }
};

export interface LeaderboardScoresRaw {
    scores: Array<LeaderboardScores>;
}

export interface UserScore extends UserScore_ {
    position: number;
}

export interface UserBestScore extends UserBestScore_ {
    position: number;
}

export interface Score extends Score_ {
    position: number;
}
