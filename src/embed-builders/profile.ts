import { getProfile } from "@utils/profile-processor";
import { grades } from "@utils/constants";
import { EmbedType } from "lilybird";
import type { ProfileBuilderOptions } from "@type/embedBuilders";
import type { Embed } from "lilybird";

export function profileBuilder({ user, mode }: ProfileBuilderOptions): Array<Embed.Structure> {
    const profile = getProfile(user, mode);
    const author = {
        name: `${user.username}: ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
        icon_url: profile.flagUrl,
        url: profile.userUrl,
    } satisfies Embed.AuthorStructure;

    const fields = [
        {
            name: "Statistics :abacus:",
            value: [
                `**Accuracy:** \`${profile.accuracy}\` • **Level:** \`${profile.level}%\``,
                `**Playcount:** \`${profile.playCount}\` (\`${profile.playHours} hrs\`)`,
                `${profile.peakGlobalRank.length > 0 ? `**Peak Rank:** #\`${profile.peakGlobalRank}\` • **Achieved:** <t:${profile.peakGlobalRankTime}:R>` : "**Peak Rank:** #`-`"}`,
                `**Followers:** \`${profile.followers}\` • **Max Combo:** \`${profile.maxCombo}\``,
                `**Recommended Star Rating:** \`${profile.recommendedStarRating}\`★`,
            ].join("\n"),
            inline: false,
        },
        {
            name: "Grades :mortar_board:",
            value: `${grades.SSH}\`${profile.rankSsh}\` ${grades.SS}\`${profile.rankSs}\` ${grades.SH}\`${profile.rankSh}\` ${grades.S}\`${profile.rankS}\` ${grades.A}\`${profile.rankA}\``,
            inline: false,
        },
    ] satisfies Array<Embed.FieldStructure>;

    const footer = { text: `Joined osu! on ${profile.joinedAt} (${profile.joinedAgo} yrs ago)` } satisfies Embed.FooterStructure;
    const thumbnail = { url: profile.avatarUrl } satisfies Embed.ThumbnailStructure;
    const image = { url: profile.bannerUrl } satisfies Embed.ImageStructure;

    return [{ type: EmbedType.Rich, author, fields, footer, thumbnail, image }] satisfies Array<Embed.Structure>;
}
