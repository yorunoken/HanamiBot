import { getProfile } from "@cleaners/profile";
import { getScore } from "@cleaners/scores";
import { SPACE } from "@utils/constants";
import { getMap } from "@utils/database";
import { downloadBeatmap } from "@utils/osu";
import { EmbedType } from "lilybird";
import type { CompareBuilderOptions } from "@type/embedBuilders";
import type { EmbedStructure } from "lilybird";
import type { Beatmap, Mode, ProfileInfo, ScoresInfo, Score } from "@type/osu";

export async function compareBuilder({
    beatmap,
    plays,
    user,
    mode,
    mods
}: CompareBuilderOptions): Promise<Array<EmbedStructure>> {
    const profile = getProfile(user, mode);

    if (mods?.name) {
        const { exclude, forceInclude, include, name } = mods;
        const filteredPlays = [];
        for (let i = 0; i < plays.length; i++) {
            const play = plays[i];
            const modsStr = play.mods.join("").toUpperCase() || "NM";

            if (exclude && !modsStr.includes(name.toUpperCase()))
                filteredPlays.push(play);
            else if (forceInclude && modsStr === name.toUpperCase())
                filteredPlays.push(play);
            else if (include && modsStr.includes(name.toUpperCase()))
                filteredPlays.push(play);
            else if (!exclude && !forceInclude && !include)
                filteredPlays.push(play);
        }
        plays = filteredPlays;
    }

    if (plays.length === 0) {
        return [
            {
                type: EmbedType.Rich,
                title: "Uh oh! :x:",
                description: `It seems like \`${profile.username}\` doesn't have any scores on this beatmap with these! :(`
            }
        ] satisfies Array<EmbedStructure>;
    }

    return getMultiplePlays({ plays, profile, beatmap, mode });
}

async function getMultiplePlays({ plays, profile, beatmap, mode }:
{
    plays: Array<Score>,
    profile: ProfileInfo,
    beatmap: Beatmap,
    mode: Mode
}): Promise<Array<EmbedStructure>> {
    const beatmapId = beatmap.id;
    const mapData = getMap(beatmapId)?.data ?? (await downloadBeatmap(beatmapId)).contents;

    const playsTemp: Array<Promise<ScoresInfo>> = [];
    for (let i = 0; i < plays.length; i++) playsTemp.push(getScore({ scores: plays, index: i, mode, beatmap, mapData }));

    const { beatmapset } = beatmap;

    let description = "";
    // Create an array of promises to await
    const playResults = await Promise.all(playsTemp);
    for (let i = 0; i < playResults.length; i++) {
        const play = playResults[i];
        const line1 = `${play.grade} **[${play.stars}]** ${SPACE}  ${play.ppFormatted} ${SPACE} **${play.accuracy}% ${SPACE} +${play.mods.join("")}**\n`;
        const line2 = `${play.score} ${SPACE} {${play.hitValues}} ${SPACE} [${play.comboValues}] ${SPACE} ${play.playSubmitted}`;
        description += `${line1 + line2}\n`;
    }

    const embed: EmbedStructure = {
        type: EmbedType.Rich,
        author: {
            name: `${profile.username} ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
            url: profile.userUrl,
            icon_url: profile.flagUrl
        },
        title: `${beatmapset.artist} - ${beatmapset.title} [${beatmap.version}]`,
        url: `https://osu.ppy.sh/b/${beatmap.id}`,
        thumbnail: { url: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/list.jpg` },
        description,
        footer: { text: `${beatmap.status.charAt(0).toUpperCase()}${beatmap.status.slice(1)} beatmapset by ${beatmap.beatmapset.creator}` }
    };

    return [embed] satisfies Array<EmbedStructure>;
}
