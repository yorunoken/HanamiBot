import { getScore, getUser } from "../functions";
import { downloadMap, getIdFromContext, getMap, getPerformanceDetails, getUsernameFromArgs, insertData, Interactionhandler, rulesets } from "../utils";
import { EmbedBuilder } from "discord.js";
import { v2 } from "osu-api-extended";
import type { Client, Message } from "discord.js";
import type { response as BeatmapResponse, response as MapResponse } from "osu-api-extended/dist/types/v2_beatmap_id_details";
import type { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_beatmap";
import type { Locales, osuModes, UserInfo } from "../Structure/index";

function leaderboardExists(beatmap: BeatmapResponse): boolean {
    return typeof beatmap.id === "number" || ["qualified", "ranked", "loved"].includes(beatmap.status.toLowerCase());
}

export async function start({ interaction, client, args, mode, locale }: { interaction: Message, client: Client, args: Array<string>, mode: osuModes | string, locale: Locales }): void {
    const options = Interactionhandler(interaction, args);

    const userOptions = getUsernameFromArgs(options.author, options.userArgs);
    if (!userOptions) {
        await options.reply(locale.fails.error);
        return;
    }

    if (userOptions.user?.status === false) {
        await options.reply(userOptions.user.message);
        return;
    }

    const beatmapId = userOptions.beatmapId || await getIdFromContext(interaction, client);
    if (!beatmapId) {
        await options.reply(locale.fails.noLeaderboard);
        return;
    }

    const beatmap = await v2.beatmap.id.details(beatmapId);
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

    let scores = (await v2.scores.user.beatmap(beatmap.id, user.id, { mode: mode as osuModes })).sort((a, b) => b.pp - a.pp);
    const mods = userOptions.mods?.codes;
    scores = mods
        ? scores.filter((score) => {
            const userMods = mods.join("").toUpperCase();
            const scoreMods = score.mods.join("").toUpperCase();
            const { force } = userOptions.mods;

            if (userMods === "NM")
                return userOptions.mods!.include ? scoreMods === "" : userOptions.mods!.remove ? scoreMods !== "" : undefined;

            const includedBool = (str: string) => scoreMods
                .match(/.{1,2}/g)
                ?.sort()
                .join("")
                .includes((str.match(/.{1,2}/g) || [""]).sort().join(""));

            const exactBool = (str: string) => scoreMods
                .match(/.{1,2}/g)
                ?.sort()
                .join("") === str
                .match(/.{1,2}/g)
                ?.sort()
                .join("");

            if (userOptions.mods!.include)
                return (force ? exactBool : includedBool)(userMods);
            else if (userOptions.mods!.remove)
                return !(force ? exactBool : includedBool)(userMods);

            return scoreMods === (userMods === "NM" ? "" : userMods);
        })
        : scores;

    if (scores.length === 0) {
        await options.reply(locale.fails.userHasNoScores(user.username));
        return;
    }

    await options.reply({ embeds: [await buildCompareEmbed(userDetailOptions, beatmap, scores, mode, locale)] });
}

async function buildCompareEmbed(user: UserInfo, map: MapResponse, scores: Array<ScoreResponse>, mode: string, locale: Locales): Promise<EmbedBuilder> {
    const scoresArr = [];
    for (let i = 0; i < scores.length; i++) {
        const { max_combo: maxCombo } = scores[i];

        const score = await getScore({ plays: scores, index: parseInt(i), mode: mode as osuModes, _isTops: false, isCompare: true, beatmap: map, locale });
        scoresArr.push(i === "0"
            ? `${score.globalPlacement.length && score.globalPlacement.length > 0 ? `${score.globalPlacement}\n` : ""}${score.grade} ${score.modsPlay} **[${score.stars}★]** • ${score.totalScore} • ${score.accuracy}\n**${score.pp}pp**/${score.ssPp}pp ~~[${score.fcPp}pp]~~ • ${score.comboValue}\n${score.accValues} <t:${score.submittedTime}:R>\n`
            : `${i === "1" ? `${locale.embeds.otherPlays}\n` : ""}${score.grade} ${score.modsPlay} **[${score.stars}★]** • **${score.pp}pp** (${score.accuracy}) • **${maxCombo}x** • ${score.performance.curPerf.effectiveMissCount > 0 ? `${score.countMiss} <:hit00:1061254490075955231>` : ""} <t:${score.submittedTime}:R>`);
    }

    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username} ${user.pp}pp (#${user.globalRank} ${user.countryCode}#${user.countryRank})`,
            // iconURL: `https://osu.ppy.sh/images/flags/${countryCode}.png`,
            iconURL: user.userAvatar,
            url: user.userUrl
        })
        .setTitle(`${map.beatmapset.artist} - ${map.beatmapset.title} [${map.version}]`)
        .setURL(`https://osu.ppy.sh/b/${map.id}`)
        .setDescription(scoresArr.join("\n"))
        .setThumbnail(`https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/list.jpg`);
}
