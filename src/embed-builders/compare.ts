import { getProfile } from "@utils/profile-processor";
import { getScore } from "@utils/scores-processor";
import { SPACE } from "@utils/constants";
import { getEntry } from "@utils/database";
import { downloadBeatmap, saveScoreDatas } from "@utils/osu";
import { Tables } from "@type/database";
import { EmbedType } from "lilybird";
import type { CompareBuilderOptions } from "@type/embedBuilders";
import type { Embed } from "lilybird";
import type { Beatmap, Mode, ProfileInfo, ScoresInfo, Score } from "@type/osu";

export async function compareBuilder({ beatmap, plays, user, mode, mods }: CompareBuilderOptions): Promise<Array<Embed.Structure>> {
    saveScoreDatas(plays, mode, beatmap);

    const profile = getProfile(user, mode);

    if (mods?.name) {
        const { exclude, forceInclude, include, name } = mods;
        const filteredPlays = [];
        for (const play of plays) {
            const modsStr = play.mods.join("").toUpperCase() || "NM";

            if (exclude && !modsStr.includes(name.toUpperCase())) filteredPlays.push(play);
            else if (forceInclude && modsStr === name.toUpperCase()) filteredPlays.push(play);
            else if (include && modsStr.includes(name.toUpperCase())) filteredPlays.push(play);
            else if (!exclude && !forceInclude && !include) filteredPlays.push(play);
        }
        plays = filteredPlays;
    }

    if (plays.length === 0) {
        return [
            {
                type: EmbedType.Rich,
                title: "Uh oh! :x:",
                description: `It seems like \`${profile.username}\` doesn't have any scores on this beatmap with these! :(`,
            },
        ] satisfies Array<Embed.Structure>;
    }

    return getMultiplePlays({ plays, profile, beatmap, mode });
}

async function getMultiplePlays({ plays, profile, beatmap, mode }: { plays: Array<Score>; profile: ProfileInfo; beatmap: Beatmap; mode: Mode }): Promise<Array<Embed.Structure>> {
    const beatmapId = beatmap.id;
    const mapData = getEntry(Tables.MAP, beatmapId)?.data ?? (await downloadBeatmap(beatmapId)).contents;

    const playsTemp: Array<Promise<ScoresInfo>> = [];
    for (let i = 0; i < plays.length; i++) playsTemp.push(getScore({ scores: plays, index: i, mode, beatmap, mapData }));

    const { beatmapset } = beatmap;

    let description = "";
    // Create an array of promises to await
    const playResults = await Promise.all(playsTemp);
    for (const playResult of playResults) {
        const line1 = `${playResult.grade} **[${playResult.stars}]** ${SPACE}  ${playResult.ppFormatted} ${SPACE} **${playResult.accuracy}% ${SPACE} +${playResult.mods.join("")}**\n`;
        const line2 = `${playResult.score} ${SPACE} {${playResult.hitValues}} ${SPACE} [${playResult.comboValues}] ${SPACE} ${playResult.playSubmitted}`;
        description += `${line1 + line2}\n`;
    }

    const embed: Embed.Structure = {
        type: EmbedType.Rich,
        author: {
            name: `${profile.username} ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
            url: profile.userUrl,
            icon_url: profile.flagUrl,
        },
        title: `${beatmapset.artist} - ${beatmapset.title} [${beatmap.version}]`,
        url: `https://osu.ppy.sh/b/${beatmap.id}`,
        thumbnail: { url: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/list.jpg` },
        description,
        footer: { text: `${beatmap.status.charAt(0).toUpperCase()}${beatmap.status.slice(1)} beatmapset by ${beatmap.beatmapset.creator}` },
    };

    return [embed] satisfies Array<Embed.Structure>;
}
