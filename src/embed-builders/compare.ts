import { getProfile } from "../cleaners/profile";
import { client } from "../utils/initalize";
import { getScore } from "../cleaners/scores";
import { SPACE } from "../utils/constants";
import { EmbedType } from "lilybird";
import type { EmbedStructure } from "lilybird";
import type { Beatmap, Mode, ProfileInfo, ScoresInfo } from "../types/osu";
import type { Mod, Score, UserExtended } from "osu-web.js";

export async function compareBuilder({ user, mode, beatmapId, mods }:
{
    user: UserExtended,
    mode: Mode,
    beatmapId: number,
    mods?: {
        exclude: null | boolean,
        include: null | boolean,
        forceInclude: null | boolean,
        name: null | Mod
    }
}): Promise<Array<EmbedStructure>> {
    const profile = getProfile(user, mode);

    const beatmap: Beatmap = await client.beatmaps.getBeatmap(beatmapId);
    if (!beatmap.id) {
        return [
            {
                type: EmbedType.Rich,
                title: "Uh oh! :x:",
                description: "It seems like this beatmap doesn't exist! :("
            }
        ] satisfies Array<EmbedStructure>;
    }

    if (["pending", "wip", "graveyard"].some((g) => g === beatmap.status)) {
        return [
            {
                type: EmbedType.Rich,
                title: "Uh oh! :x:",
                description: "It seems like this beatmap's leaderboards don't exist! :("
            }
        ] satisfies Array<EmbedStructure>;
    }
    let plays = (await client.beatmaps.getBeatmapUserScores(beatmapId, user.id, { query: { mode } })).sort((a, b) => b.pp - a.pp);

    if (mods?.name) {
        const { exclude, forceInclude, include, name } = mods;
        plays = plays.filter((play) => {
            const modsStr = play.mods.join("").toUpperCase() || "NM";

            if (exclude)
                return !modsStr.includes(name.toUpperCase());
            else if (forceInclude)
                return modsStr === name.toUpperCase();
            else if (include)
                return modsStr.includes(name.toUpperCase());

            // If none of the conditions match, return normal plays array
            return true;
        });
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
    const playsTemp: Array<Promise<ScoresInfo>> = [];
    for (let i = 0; i < plays.length; i++) playsTemp.push(getScore({ scores: plays, index: i, mode, beatmap }));

    const embed: EmbedStructure = {
        type: EmbedType.Rich,
        author: {
            name: `${profile.username} ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
            url: profile.userUrl,
            icon_url: profile.flagUrl
        },
        thumbnail: { url: profile.avatarUrl },
        description: (await Promise.all(playsTemp))
            .map((play) => {
                const line1 = `**#${play.position} [${play.songName} [${play.difficultyName}]](${play.mapLink}) +${play.mods.join("")} ${play.stars}**\n`;
                const line2 = `${play.grade} ${play.ppFormatted} ${SPACE} ${play.score} ${SPACE} **${play.accuracy}%**\n`;
                const line3 = `${play.hitValues} ${SPACE} ${play.comboValues} ${SPACE} ${play.playSubmitted}`;

                return line1 + line2 + line3;
            })
            .join("\n"),
        footer: { text: `${beatmap.status.charAt(0).toUpperCase()}${beatmap.status.slice(1)} beatmapset by ${beatmap.beatmapset.creator}` }
    };

    return [embed] satisfies Array<EmbedStructure>;
}
