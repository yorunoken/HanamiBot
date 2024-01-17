import type { ProfileInfo } from "../types/osu";
import type { response as User } from "osu-api-extended/dist/types/v2_user_details";

export function getProfile(user: User): ProfileInfo {
    const { statistics } = user;
    const userJoinDate = new Date(user.join_date);

    return {
        username: user.username,
        userCover: user.cover_url,
        userAvatar: user.avatar_url,
        userUrl: `https://osu.ppy.sh/users/${user.id}/${mode}`,
        coverUrl: user.cover_url,
        userFlag: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
        countryCode: user.country.code,
        globalRank: statistics.global_rank.toLocaleString() || "-",
        countryRank: statistics.country_rank.toLocaleString() || "-",
        pp: statistics.pp.toLocaleString(),
        accuracy: statistics.hit_accuracy.toFixed(2),
        level: `${user.statistics.level.current}.${statistics.level.progress.toString(10).padStart(2, "0")}`,
        playCount: statistics.play_count.toLocaleString(),
        playHours: (statistics.play_time / 3600).toFixed(0),
        followers: user.follower_count.toLocaleString(),
        maxCombo: statistics.maximum_combo.toLocaleString(),
        rankedScore: statistics.ranked_score.toLocaleString(),
        totalScore: statistics.total_score.toLocaleString(),
        objectsHit: statistics.total_hits.toLocaleString(),
        occupation: user.occupation,
        interest: user.interests,
        location: user.location,
        highestRank: user.rank_highest.rank.toLocaleString(),
        highestRankTime: new Date(user.rank_highest.updated_at).getTime() / 1000,
        recommendedStarRating: (Math.pow(statistics.pp, 0.4) * 0.195).toFixed(2),
        userJoinedAgo: (Math.floor((Date.now() - userJoinDate.valueOf()) / (1000 * 60 * 60 * 24 * 30)) / 12).toFixed(1),
        formattedDate: userJoinDate.toLocaleDateString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            timeZone: "UTC"
        }),
        rankS: statistics.grade_counts.s.toLocaleString(),
        rankA: statistics.grade_counts.a.toLocaleString(),
        rankSs: statistics.grade_counts.ss.toLocaleString(),
        rankSh: statistics.grade_counts.sh.toLocaleString(),
        rankSsh: statistics.grade_counts.ssh.toLocaleString()
    };
}