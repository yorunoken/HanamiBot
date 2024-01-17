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
    occupation: string;
    interest: string;
    location: string;
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
