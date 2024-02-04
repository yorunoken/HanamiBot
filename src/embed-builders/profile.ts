import { getProfile } from "../cleaners/profile";
import { grades } from "../utils/emotes";
import { EmbedType } from "lilybird";
import type { UserExtended } from "osu-web.js";
import type { EmbedAuthorStructure, EmbedFieldStructure, EmbedFooterStructure, EmbedImageStructure, EmbedStructure, EmbedThumbnailStructure } from "lilybird";
import type { Modes } from "../types/osu";

export function profileBuilder(user: UserExtended, mode: Modes): Array<EmbedStructure> {
    const profile = getProfile(user, mode);
    const author = {
        name: `${user.username}: ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
        icon_url: profile.flagUrl,
        url: profile.userUrl
    } satisfies EmbedAuthorStructure;

    const fields = [
        {
            name: "Statistics :abacus:",
            value: `**Accuracy:** \`${profile.accuracy}\` • **Level:** \`${profile.level}%\`
            **Playcount:** \`${profile.playCount}\` (\`${profile.playHours} hrs\`)
            ${profile.peakGlobalRank.length > 0 ? `**Peak Rank:** #\`${profile.peakGlobalRank}\` • **Achieved:** <t:${profile.peakGlobalRankTime}:R>` : "**Peak Rank:** #`-`"}
            **Followers:** \`${profile.followers}\` • **Max Combo:** \`${profile.maxCombo}\`
            **Recommended Star Rating:** \`${profile.recommendedStarRating}\`★`,
            inline: false
        },
        {
            name: "Grades :mortar_board:",
            value: `${grades.SSH}\`${profile.rankSsh}\` ${grades.SS}\`${profile.rankSs}\` ${grades.SH}\`${profile.rankSh}\` ${grades.S}\`${profile.rankS}\` ${grades.A}\`${profile.rankA}\``,
            inline: false
        }
    ] satisfies Array<EmbedFieldStructure>;

    const footer = { text: `Joined osu! on ${profile.joinedAt} (${profile.joinedAgo} yrs ago)` } satisfies EmbedFooterStructure;
    const thumbnail = { url: profile.avatarUrl } satisfies EmbedThumbnailStructure;
    const image = { url: profile.coverUrl } satisfies EmbedImageStructure;

    return [ { type: EmbedType.Rich, author, fields, footer, thumbnail, image } ] satisfies Array<EmbedStructure>;
}
