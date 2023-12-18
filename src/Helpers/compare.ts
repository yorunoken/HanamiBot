import { getScore, getUser } from "../functions";
import { getIdFromContext, getUsernameFromArgs, interactionhandler } from "../utils";
import { EmbedBuilder } from "discord.js";
import { v2 } from "osu-api-extended";
import type { Client, Message } from "discord.js";
import type { response as BeatmapResponse, response as MapResponse } from "osu-api-extended/dist/types/v2_beatmap_id_details";
import type { response as ScoreResponseBeatmap } from "osu-api-extended/dist/types/v2_scores_user_beatmap";
import type { Locales, osuModes, ScoreInfo, UserInfo } from "../Structure/index";

function leaderboardExists(beatmap: BeatmapResponse): boolean {
    return typeof beatmap.id === "number" || ["qualified", "ranked", "loved"].includes(beatmap.status.toLowerCase());
}

export async function start({ interaction, client, args, mode, locale }: { interaction: Message, client: Client, args: Array<string>, mode: osuModes | "", locale: Locales }): Promise<void> {
    const options = interactionhandler(interaction, args);

    const userOptions = getUsernameFromArgs(options.author, options.userArgs);
    if (!userOptions) {
        await options.reply(locale.fails.error);
        return;
    }

    if (typeof userOptions.user === "object") {
        await options.reply(userOptions.user.message);
        return;
    }
    if (!userOptions.user)
        return;

    const beatmapId = userOptions.beatmapId ?? await getIdFromContext(interaction, client);
    if (beatmapId === undefined || beatmapId === null) {
        await options.reply(locale.fails.noLeaderboard);
        return;
    }

    const beatmap = await v2.beatmap.id.details(+beatmapId);
    if (!leaderboardExists(beatmap)) {
        await options.reply(locale.fails.noBeatmapIdInCtx);
        return;
    }

    mode = mode.length > 0 ? mode : beatmap.mode;

    const user = await v2.user.details(userOptions.user, options.mode);
    if (!user.id) {
        await options.reply(locale.fails.userDoesntExist(userOptions.user));
        return;
    }

    const userDetailOptions = getUser({ user, mode: options.mode, locale });

    const mods = userOptions.mods?.codes;
    const scores = (await v2.scores.user.beatmap(beatmap.id, user.id, { mode: mode as osuModes })).sort((a, b) => b.pp - a.pp);

    if (mods !== undefined && mods !== null) {
        scores.filter((score) => {
            const userMods = mods.join("").toUpperCase();
            const scoreMods = score.mods.join("").toUpperCase();
            const force = userOptions.mods?.force;

            if (userMods === "NM")
                return userOptions.mods?.include ? scoreMods === "" : userOptions.mods?.remove ? scoreMods !== "" : undefined;

            function includedBool(str: string): boolean | undefined {
                return scoreMods
                    .match(/.{1,2}/g)
                    ?.sort()
                    .join("")
                    .includes((str.match(/.{1,2}/g) ?? [""]).sort().join(""));
            }

            function exactBool(str: string): boolean {
                return scoreMods
                    .match(/.{1,2}/g)
                    ?.sort()
                    .join("") === str
                    .match(/.{1,2}/g)
                    ?.sort()
                    .join("");
            }

            if (userOptions.mods?.include)
                return (force ? exactBool : includedBool)(userMods);
            else if (userOptions.mods?.remove)
                return !(force ? exactBool : includedBool)(userMods);

            return scoreMods === (userMods === "NM" ? "" : userMods);
        });
    }

    if (scores.length === 0) {
        await options.reply(locale.fails.userHasNoScores(user.username));
        return;
    }

    await options.reply({ embeds: [await buildCompareEmbed(userDetailOptions, beatmap, scores, mode, locale)] });
}

async function buildCompareEmbed(user: UserInfo, map: MapResponse, scores: Array<ScoreResponseBeatmap>, mode: string, locale: Locales): Promise<EmbedBuilder> {
    const temp: Array<Promise<ScoreInfo>> = scores.map(async (_, index) => getScore({ plays: scores, index, mode: mode as osuModes, isCompare: true, beatmap: map, locale }));

    const scoresPromise = await Promise.all(temp);
    const scoresArr = scoresPromise.map((score, index) => {
        const { max_combo: maxCombo } = scores[index];

        if (index === 0) {
            return `${score.globalPlacement.length && score.globalPlacement.length > 0 ? `${score.globalPlacement}\n` : ""}
            ${score.grade} ${score.modsPlay} **[${score.stars}★]** • ${score.totalScore} • ${score.accuracy}
            **${score.pp}pp**/${score.ssPp}pp ~~[${score.fcPp}pp]~~ • ${score.comboValue}\n${score.accValues} <t:${score.submittedTime}:R>\n`;
        }

        return `${index === 1 ? `${locale.embeds.otherPlays}\n` : ""}
            ${score.grade} ${score.modsPlay} **[${score.stars}★]** • **${score.pp}pp** (${score.accuracy}) • **${maxCombo}x** • ${score.countMiss > 0 ?
    `${score.countMiss} <:hit00:1061254490075955231>`
    : ""} <t:${score.submittedTime}:R>`;
    });

    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username} ${user.pp}pp (#${user.globalRank} ${user.countryCode}#${user.countryRank})`,
            // iconURL: `https://osu.ppy.sh/images/flags/${countryCode}.png`,
            iconURL: user.userAvatar,
            url: user.userUrl
        })
        .setTitle(`${map.beatmapset.artist} - ${map.beatmapset.title} [${map.version}]`)
        .setURL(`https://osu.ppy.sh/b/${map.id}`)
        .setDescription(scoresArr.join(""))
        .setThumbnail(`https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/list.jpg`);
}
