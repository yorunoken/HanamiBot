import { getProfile } from "../cleaners/profile";
import { client } from "../utils/initalize";
import { getScore } from "../cleaners/scores";
import { SPACE } from "../utils/constants";
import { getUser } from "../utils/database";
import { EmbedType } from "lilybird";
import type { EmbedAuthorStructure, EmbedFieldStructure, EmbedFooterStructure, EmbedImageStructure, EmbedStructure, EmbedThumbnailStructure } from "lilybird";
import type { Modes, ProfileInfo, ScoresInfo } from "../types/osu";
import type { Mod, UserBestScore, UserExtended, UserScore } from "osu-web.js";

export async function playBuilder({ user, mode, includeFails = true, index, type, mods, initiatorId, isMultiple }:
{
    user: UserExtended,
    mode: Modes,
    type: "best" | "firsts" | "recent",
    index: number,
    initiatorId: string,
    includeFails?: boolean,
    mods?: {
        exclude: null | boolean,
        include: null | boolean,
        forceInclude: null | boolean,
        name: null | Mod
    },
    isMultiple?: boolean
}): Promise<Array<EmbedStructure>> {
    const profile = getProfile(user, mode);

    let plays = await client.users.getUserScores(user.id, type, { query: { mode, limit: 100, include_fails: includeFails } });

    if (type === "best" && index === 0) {
        // Implement page-based plays here
    }

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
                description: `It seems like \`${profile.username}\` hasn't had any recent plays in the last 24 hours with those filters!`
            }
        ] satisfies Array<EmbedStructure>;
    }

    return isMultiple ? getMultiplePlays({ plays, page: index, mode, profile }) : getSinglePlay({ mode, index, plays, profile, initiatorId });
}

async function getSinglePlay({ mode, index, plays, profile, initiatorId }:
{
    plays: Array<UserBestScore> | Array<UserScore>,
    mode: Modes,
    profile: ProfileInfo,
    index: number,
    initiatorId: string
}): Promise<Array<EmbedStructure>> {
    const maximized = getUser(initiatorId)?.score_embeds ?? 1;

    const play = await getScore({ scores: plays, index, mode });
    const { mapValues } = play.performance;

    const author = {
        name: `${profile.username} ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
        url: profile.userUrl,
        icon_url: profile.avatarUrl
    } satisfies EmbedAuthorStructure;

    const fields = [
        {
            name: `${play.rulesetEmote} ${play.difficultyName} **+${play.mods.join("")}** [${play.stars}]`,
            value: `${play.grade} ${SPACE} ${play.score === "0" ? "140,000" : play.score} ${SPACE} **${play.accuracy}%** ${SPACE} ${play.playSubmitted}
            ${play.ppFormatted} ${SPACE} ${play.comboValues} ${SPACE} ${play.hitValues}
            ${play.ifFcValues ?? ""}`,
            inline: false
        }
    ] satisfies Array<EmbedFieldStructure>;

    if (maximized === 1) {
        fields.push({
            name: "Beatmap Info:",
            value: `**BPM:** \`${mapValues.bpm.toFixed().toLocaleString()}\` ${SPACE} **Length:** \`${play.drainLength}\`
            **AR:** \`${mapValues.ar.toFixed(1)}\` ${SPACE} **OD:** \`${mapValues.od.toFixed(1)}\` ${SPACE} **CS:** \`${mapValues.cs.toFixed(1)}\` ${SPACE} **HP:** \`${mapValues.hp.toFixed(1)}\``,
            inline: false
        });
    }

    const image = maximized === 1 ? { url: play.coverLink } satisfies EmbedImageStructure : undefined;
    const thumbnail = maximized === 0 ? { url: play.listLink } satisfies EmbedThumbnailStructure : undefined;
    const title = play.songTitle;
    const url = play.mapLink;
    const footer: EmbedFooterStructure = { text: `${play.mapStatus} mapset by ${play.mapAuthor}` };

    return [ { type: EmbedType.Rich, author, fields, image, thumbnail, footer, url, title } ] satisfies Array<EmbedStructure>;
}

async function getMultiplePlays({ plays, page, mode, profile }:
{
    plays: Array<UserBestScore> | Array<UserScore>,
    page: number,
    mode: Modes,
    profile: ProfileInfo
}): Promise<Array<EmbedStructure>> {
    const pageStart = page * 5;
    const pageEnd = pageStart + 5;

    const playsTemp: Array<Promise<ScoresInfo>> = [];
    for (let i = pageStart; pageEnd > i && i < plays.length; i++) playsTemp.push(getScore({ scores: plays, index: i, mode }));

    const embed: EmbedStructure = {
        type: EmbedType.Rich,
        author: {
            name: `${profile.username} ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
            url: profile.userUrl,
            icon_url: profile.flagUrl
        },
        thumbnail: { url: profile.avatarUrl },
        description: (await Promise.all(playsTemp))
            .map((play) => `**#${play.position} [${play.songName} [${play.difficultyName}]](${play.mapLink}) +${play.mods.join("")} ${play.stars}**
            ${play.grade} ${play.ppFormatted} ${SPACE} ${play.score} ${SPACE} **${play.accuracy}%**
            ${play.hitValues} ${SPACE} ${play.comboValues} ${SPACE} ${play.playSubmitted}`)
            .join("\n"),
        footer: { text: `Page ${page + 1} of ${Math.ceil(plays.length / 5)}` }
    };

    return [embed] satisfies Array<EmbedStructure>;
}
