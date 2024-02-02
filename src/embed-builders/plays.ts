import { getProfile } from "../cleaners/profile";
import { client } from "../utils/initalize";
import { getScore } from "../cleaners/scores";
import { SPACE } from "../utils/constants";
import { EmbedType } from "lilybird";
import type { EmbedAuthorStructure, EmbedFieldStructure, EmbedStructure, EmbedThumbnailStructure } from "lilybird";
import type { Modes } from "../types/osu";
import type { UserExtended } from "osu-web.js";

export async function playBuilder({ user, mode, includeFails = true, index, type }:
{ user: UserExtended, mode: Modes, type: "best" | "firsts" | "recent", includeFails: boolean, index: number }): Promise<EmbedStructure> {
    const profile = getProfile(user, mode);
    const plays = await client.users.getUserScores(user.id, type, { query: { mode, limit: 100, include_fails: includeFails } });
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

    return { type: EmbedType.Rich, author, fields, thumbnail, url, title } as EmbedStructure;
}
