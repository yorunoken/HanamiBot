import type { MapAttributes, PerformanceAttributes } from "rosu-pp";

export type Modes = "osu" | "mania" | "taiko" | "fruits";

export interface ProfileInfo {
    username: string;
    userCover: string;
    avatarUrl: string;
    userUrl: string;
    coverUrl: string;
    flagUrl: string;
    countryCode: string;
    globalRank: string;
    countryRank: string;
    peakGlobalRank: string;
    peakGlobalRankTime: number;
    pp: string;
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
    difficultyName: string;
    score: string;
    accuracy: string;
    mapLink: string;
    coverLink: string;
    listLink: string;
    grade: string;
    hitValues: string;
    mapAuthor: string;
    mapStatus: string;
    mods: Array<string>;
    drainLength: string;
    stars: string;
    rulesetEmote: string;
    ppFormatted: string;
    playSubmitted: string;
    ifFcValues: string | null;
    comboValues: string;
    performance: PerformanceInfo;
}

export interface PerformanceInfo {
    mapValues: MapAttributes;
    perfectPerformance: PerformanceAttributes;
    currentPerformance: PerformanceAttributes;
    fcPerformance: PerformanceAttributes;
    mapId: number;
}

export type AuthScope = "public" | "chat.write" | "delegate" | "forum.write" | "friends.read" | "identify";

export interface AccessTokenJson {
    access_token: string;
    expires_in: string;
}

export interface PlayStatistics {
    count_100: number | undefined;
    count_300: number | undefined;
    count_50: number | undefined;
    count_geki: number | undefined;
    count_katu: number | undefined;
    count_miss: number;
}
