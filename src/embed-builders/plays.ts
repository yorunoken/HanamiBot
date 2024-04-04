import { getProfile } from "@cleaners/profile";
import { getScore } from "@cleaners/scores";
import { SPACE } from "@utils/constants";
import { getUser } from "@utils/database";
import { EmbedScoreType } from "@type/database";
import { EmbedType } from "lilybird";
import type { DatabaseUser } from "@type/database";
import type { UserScore, Mode, ProfileInfo, ScoresInfo, UserBestScore } from "@type/osu";
import type { PlaysBuilderOptions } from "@type/embedBuilders";
import type { EmbedAuthorStructure, EmbedFieldStructure, EmbedFooterStructure, EmbedImageStructure, EmbedStructure, EmbedThumbnailStructure } from "lilybird";

export async function playBuilder({
    plays,
    user,
    mode,
    index,
    mods,
    initiatorId,
    isMultiple,
    page,
    userDb,
    sortByDate
}: PlaysBuilderOptions): Promise<Array<EmbedStructure>> {
    if (typeof page === "undefined" && typeof index === "undefined") {
        if (isMultiple)
            page = 0;
        else index = 0;
    }

    const profile = getProfile(user, mode);

    if (mods?.name) {
        const { exclude, forceInclude, include, name } = mods;
        const filteredPlays = [];
        for (let i = 0; i < plays.length; i++) {
            const play = plays[i];
            const modsStr = play.mods.join("").toUpperCase() || "NM";

            if (exclude) {
                if (!modsStr.includes(name.toUpperCase()))
                    filteredPlays.push(play);
            } else if (forceInclude) {
                if (modsStr === name.toUpperCase())
                    filteredPlays.push(play);
            } else if (include) {
                if (modsStr.includes(name.toUpperCase()))
                    filteredPlays.push(play);
            } else
                filteredPlays.push(play);
        }

        plays = filteredPlays;
    }

    if (sortByDate)
        plays = plays.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (index && index >= plays.length) {
        return [
            {
                type: EmbedType.Rich,
                title: "Uh oh! :x:",
                description: `It seems like \`${profile.username}\` hasn't had any recent plays in the last 24 hours with those filters!`
            }
        ] satisfies Array<EmbedStructure>;
    }

    return typeof page !== "undefined" ? getMultiplePlays({ plays, page, mode, profile, userDb }) : getSinglePlay({ mode, index: index ?? 0, plays, profile, userDb, isMultiple });
}

async function getSinglePlay({ mode, index, plays, profile, userDb, isMultiple }:
{
    plays: Array<UserBestScore> | Array<UserScore>,
    mode: Mode,
    profile: ProfileInfo,
    index: number,
    userDb: DatabaseUser | null,
    isMultiple?: boolean
}): Promise<Array<EmbedStructure>> {
    const isMaximized = userDb?.score_embeds ?? 1;
    const embedType = userDb?.embed_type ?? EmbedScoreType.Hanami;

    const play = await getScore({ scores: plays, index, mode });
    const { mapValues } = play.performance;

    if (embedType === EmbedScoreType.Hanami) {
        const author = {
            name: `${profile.username} ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
            url: profile.userUrl,
            icon_url: profile.avatarUrl
        } satisfies EmbedAuthorStructure;

        const line1 = `${play.grade} ${play.percentagePassed !== null ? `**@${play.percentagePassed}%**` : ""} ${SPACE} ${play.score} ${SPACE} **${play.accuracy}%** ${SPACE} ${play.playSubmitted}\n`;
        const line2 = `${play.ppFormatted} ${SPACE} ${play.comboValues} ${SPACE} ${play.hitValues}\n`;
        const line3 = `${play.ifFcValues ?? ""}\n`;

        const fields = [
            {
                name: `${play.rulesetEmote} ${play.difficultyName} **+${play.mods.join("")}** [${play.stars}] ${isMultiple ? `${SPACE} Top **__#${play.position}__** of ${plays.length}` : ""}`,
                value: line1 + line2,
                inline: false
            }
        ] satisfies Array<EmbedFieldStructure>;

        if (isMaximized === 1) {
            fields[0].value += line3;
            const beatmapInfoField = [
                `**BPM:** \`${mapValues.bpm.toFixed().toLocaleString()}\` ${SPACE} **Length:** \`${play.drainLength}\``,
                `**AR:** \`${mapValues.ar.toFixed(1)}\` ${SPACE} **OD:** \`${mapValues.od.toFixed(1)}\` ${SPACE} **CS:** \`${mapValues.cs.toFixed(1)}\` ${SPACE} **HP:** \`${mapValues.hp.toFixed(1)}\``
            ];
            fields.push({
                name: "Beatmap Info:",
                value: beatmapInfoField.join("\n"),
                inline: false
            });
        }

        const image = isMaximized === 1 ? { url: play.coverLink } satisfies EmbedImageStructure : undefined;
        const thumbnail = isMaximized === 0 ? { url: play.listLink } satisfies EmbedThumbnailStructure : undefined;
        const title = play.songTitle;
        const url = play.mapLink;
        const footer: EmbedFooterStructure = {
            text: `${play.mapStatus} mapset by ${play.mapAuthor}${isMaximized === 1 && !isMultiple ? ` ${SPACE} - Play ${index + 1} of ${plays.length} ${SPACE} - Try ${play.retries}` : ""}`
        };

        return [ { type: EmbedType.Rich, author, fields, image, thumbnail, footer, url, title } ];
    }

    if (embedType === EmbedScoreType.Bathbot) {
        const beatmapInfoField = [
            `**Length:** \`${play.drainLength}\` ${SPACE} **BPM:** \`${mapValues.bpm.toFixed().toLocaleString()}\` ${SPACE} **Objects** \`${mapValues.nObjects}\``,
            `**AR:** \`${mapValues.ar.toFixed(1)}\` ${SPACE} **OD:** \`${mapValues.od
                .toFixed(1)}\` ${SPACE} **CS:** \`${mapValues.cs.toFixed(1)}\` ${SPACE} **HP:** \`${mapValues.hp.toFixed(1)}\` **Stars:** ${play.stars}`
        ];

        return [
            {
                type: EmbedType.Rich,
                author: {
                    name: `${profile.username} ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}${profile.countryRank})`,
                    url: profile.userUrl,
                    icon_url: profile.flagUrl
                },
                title: `${play.songTitle} [${play.difficultyName}]`,
                url: play.mapLink,
                image: { url: play.coverLink },
                fields: [
                    { name: "Grade", value: `${play.grade} @${play.percentagePassed}%`, inline: true },
                    { name: "Score", value: play.score, inline: true },
                    { name: "Acc", value: `${play.accuracy}%`, inline: true },
                    { name: "PP", value: `${play.ppFormatted}`, inline: true },
                    { name: "Combo", value: `${play.comboValues}`, inline: true },
                    { name: "Hits", value: `${play.hitValues}`, inline: true },
                    { name: "Map Info", value: beatmapInfoField.join("\n"), inline: false }
                ]
            }
        ];
    }
}

async function getMultiplePlays({ plays, page, mode, profile }:
{
    plays: Array<UserBestScore> | Array<UserScore>,
    page: number,
    mode: Mode,
    profile: ProfileInfo,
    userDb: DatabaseUser | null
}): Promise<Array<EmbedStructure>> {
    const pageStart = page * 5;
    const pageEnd = pageStart + 5;

    const playsTemp: Array<Promise<ScoresInfo>> = [];
    for (let i = pageStart; pageEnd > i && i < plays.length; i++) playsTemp.push(getScore({ scores: plays, index: i, mode }));

    let description = "";
    // Create an array of promises to await
    const playResults = await Promise.all(playsTemp);
    for (let i = 0; i < playResults.length; i++) {
        const play = playResults[i];
        const line1 = `**#${play.position} [${play.songName} [${play.difficultyName}]](${play.mapLink}) +${play.mods.join("")} ${play.stars}**\n`;
        const line2 = `${play.grade} ${play.ppFormatted} ${SPACE} ${play.score} ${SPACE} **${play.accuracy}%**\n`;
        const line3 = `${play.hitValues} ${SPACE} ${play.comboValues} ${SPACE} ${play.playSubmitted}`;

        description += `${line1 + line2 + line3}\n`;
    }

    const embed: EmbedStructure = {
        type: EmbedType.Rich,
        author: {
            name: `${profile.username} ${profile.pp}pp (#${profile.globalRank} ${profile.countryCode}#${profile.countryRank})`,
            url: profile.userUrl,
            icon_url: profile.flagUrl
        },
        thumbnail: { url: profile.avatarUrl },
        description,
        footer: { text: `Page ${page + 1} of ${Math.ceil(plays.length / 5)}` }
    };

    return [embed] satisfies Array<EmbedStructure>;
}
