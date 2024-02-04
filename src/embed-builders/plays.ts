import { getProfile } from "../cleaners/profile";
import { client } from "../utils/initalize";
import { getScore } from "../cleaners/scores";
import { SPACE } from "../utils/constants";
import { EmbedType } from "lilybird";
import type { EmbedAuthorStructure, EmbedFieldStructure, EmbedStructure, EmbedThumbnailStructure } from "lilybird";
import type { Modes } from "../types/osu";
import type { Mod, UserExtended } from "osu-web.js";

export async function playBuilder({ user, mode, includeFails = true, index, type, mods }:
{
    user: UserExtended,
    mode: Modes,
    type: "best" | "firsts" | "recent",
    includeFails: boolean,
    index: number,
    mods?: {
        exclude: null | boolean,
        include: null | boolean,
        forceInclude: null | boolean,
        name: null | Mod
    }
}): Promise<Array<EmbedStructure>> {
    const profile = getProfile(user, mode);

    let plays = await client.users.getUserScores(user.id, type, { query: { mode, limit: 100, include_fails: includeFails } });

    if (mods?.name) {
        const { exclude, forceInclude, include, name } = mods;
        plays = plays.filter((play) => {
            const modsStr = play.mods.join("").toUpperCase();

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
                description: `It seems like \`${profile.username}\` hasn't had any recent plays in the last 24 hours with those filters!`
            }
        ] as Array<EmbedStructure>;
    }

    const play = await getScore({ scores: plays, index, mode });
    const { mapValues } = play.performance;

    const author = {
        name: `${profile.username} ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
        url: profile.userUrl,
        icon_url: profile.avatarUrl
    } satisfies EmbedAuthorStructure;

    const fields = [
        {
            name: `${play.rulesetEmote} ${play.difficultyName} [${play.stars}]`,
            value: `${play.grade} **+${play.mods.join("")}** ${SPACE} ${play.score} ${SPACE} ${play.accuracy}% ${SPACE} ${play.playSubmitted}
            ${play.ppFormatted} ${SPACE} ${play.comboValues} ${SPACE} ${play.hitValues}
            ${play.ifFcValues ?? ""}`,
            inline: false
        },
        {
            name: "Beatmap Info:",
            value: `**BPM:** \`${mapValues.bpm.toFixed().toLocaleString()}\` ${SPACE} **Length:** \`${play.drainLength}\`
            **AR:** \`${mapValues.ar.toFixed(1)}\` ${SPACE} **OD:** \`${mapValues.od.toFixed(1)}\` ${SPACE} **CS:** \`${mapValues.cs.toFixed(1)}\` ${SPACE} **HP:** \`${mapValues.hp.toFixed(1)}\``,
            inline: false
        }
    ] as Array<EmbedFieldStructure>;

    const thumbnail = { url: play.coverLink } as EmbedThumbnailStructure;
    const title = play.songTitle;
    const url = play.mapLink;

    return [ { type: EmbedType.Rich, author, fields, thumbnail, url, title }, { type: EmbedType.Rich } ] as Array<EmbedStructure>;
}
