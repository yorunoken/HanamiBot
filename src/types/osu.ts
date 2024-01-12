export type modes = "osu" | "mania" | "taiko" | "fruits";

export interface ProfileInfo {
    username: string;
    userCover: string;
    userAvatar: string;
    userUrl: string;
    coverUrl: string;
    userFlag: string;
    countryCode: string;
    globalRank: string;
    countryRank: string;
    pp: string;
    rankedScore: string;
    totalScore: string;
    objectsHit: string;
    occupation: string;
    interest: string;
    location: string;
    highestRank: string;
    highestRankTime: number;
    recommendedStarRating: string;
    userJoinedAgo: string;
    formattedDate: string;
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
