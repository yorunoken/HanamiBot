import { getBeatmap } from "../functions";
import { Commands } from "../Structure";
import {
    buildActionRow,
    buttonBoolsTops,
    downloadMap,
    firstButton,
    getIdFromContext,
    getMap,
    getPerformanceDetails,
    getUsernameFromArgs,
    grades, insertData,
    interactionhandler,
    lastButton,
    nextButton,
    previousButton,
    specifyButton
} from "../utils";
import { EmbedBuilder } from "discord.js";
import { v2 } from "osu-api-extended";
import type { response as BeatmapResponse } from "osu-api-extended/dist/types/v2_beatmap_id_details";
import type { BeatmapInfo, Locales, ExtendedClient, Leaderboard, LeaderboardScores } from "../Structure";
import type { Message, User } from "discord.js";

function leaderboardExists(beatmap: BeatmapResponse): boolean {
    return typeof beatmap.id === "number" && ["qualified", "ranked", "loved"].includes(beatmap.status.toLowerCase());
}

interface LeaderboardInitializer {
    user: User;
    score: LeaderboardScores | undefined;
    index: number;
}

export async function start({ interaction, client, args, type, locale }: { interaction: Message, client: ExtendedClient, args: Array<string>, type: "global" | "country", locale: Locales }): Promise<void> {
    const options = interactionhandler(interaction, args);

    const userOptions = getUsernameFromArgs(options.author, options.userArgs, true);
    if (!userOptions) {
        await options.reply(locale.fails.error);
        return;
    }

    const page = parseInt(userOptions.flags.p ?? userOptions.flags.page ?? "1") - 1;

    let beatmapId = userOptions.beatmapId ?? await getIdFromContext(interaction, client);
    if (beatmapId === undefined || beatmapId === null) {
        await options.reply(locale.fails.noLeaderboard);
        return;
    }
    beatmapId = +beatmapId;

    const beatmap = await v2.beatmap.id.details(beatmapId);
    if (!leaderboardExists(beatmap)) {
        await options.reply(locale.fails.noBeatmapIdInCtx);
        return;
    }

    let file = getMap(beatmapId.toString())?.data;
    if (!file || !["ranked", "loved", "approved"].includes(beatmap.status)) {
        const value = await downloadMap(beatmapId);
        if (Array.isArray(value))
            return;

        file = value;
        insertData({ table: "maps", id: beatmapId.toString(), data: [ { name: "data", value } ] });
    }

    const scores = await fetch(
        `https://osu.ppy.sh/beatmaps/${beatmap.id}/scores?mode=${beatmap.mode}&type=${type}${
            userOptions.mods?.codes
                ? userOptions.mods.codes.join("").match(/.{1,2}/g)?.map((mod) => `&mods[]=${mod}`).join("")
                : ""
        }`,
        { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } }
    ).then(async (res) => res.json() as Promise<Leaderboard>);

    const scoresLength = scores.scores.length;
    const lengthCeil = Math.ceil(scoresLength / 5);
    if (scoresLength === 0) {
        await options.reply(locale.embeds.leaderboard.noScores);
        return;
    }

    if (page < 0 || page >= lengthCeil) {
        await options.reply(locale.fails.provideValidPage(lengthCeil));
        return;
    }

    const embedOptions = {
        map: getBeatmap(beatmap, { mods: userOptions.mods?.codes ?? [""] }, file, locale),
        plays: scores.scores,
        page,
        file,
        length: scoresLength,
        locale,
        initializer: typeof userOptions.user === "string" ?
            {
                user: interaction.author,
                score: scores.scores.find((score) => score.user.id.toString() === userOptions.user),
                index: scores.scores.findIndex((score) => score.user.id.toString() === userOptions.user)
            }
            : undefined
    };

    options.reply({
        content: locale.embeds.leaderboard.type(type === "global" ? locale.embeds.leaderboard.global : locale.embeds.leaderboard.country),
        embeds: [buildMapEmbed(embedOptions)],
        components: [
            buildActionRow(
                [firstButton, previousButton, specifyButton, nextButton, lastButton],
                [
                    page === 0,
                    buttonBoolsTops("previous", embedOptions),
                    false,
                    buttonBoolsTops("next", embedOptions),
                    page === lengthCeil - 1
                ]
            )
        ]
    }).then((response) => {
        client.sillyOptions[response.id] = { buttonHandler: "handleTopsButtons", type: Commands.Top, embedOptions, response, pageBuilder: buildMapEmbed, initializer: options.author };
    }).catch((e) => { console.error(e); });
}

function buildMapEmbed({ map, plays, page, file, initializer, locale }:
{ map: BeatmapInfo, plays: Array<LeaderboardScores>, page: number, file: string, initializer: LeaderboardInitializer | undefined, locale: Locales }): EmbedBuilder {
    const description = [];
    const startPage = page * 5;
    const endPage = startPage + 5;

    for (let i = startPage; i < endPage && i < plays.length; i++) {
        const score = plays[i];
        const stats = score.statistics;
        const mods = score.mods.length > 0 ? score.mods.map((mod) => mod.acronym) : [""];
        const hitValues = { count_300: stats.great ?? 0, count_100: stats.ok ?? 0, count_50: stats.meh ?? 0, count_miss: stats.miss ?? 0, count_geki: stats.perfect ?? 0, count_katu: stats.good ?? 0 };
        const performance = getPerformanceDetails({ mapText: file, maxCombo: score.max_combo, modsArg: mods, rulesetId: map.rulesetId, hitValues });

        const userLink = `[${score.user.username}](https://osu.ppy.sh/users/${score.user.id})`;
        const accValues = `{ **${score.ruleset_id === 3 ? `${hitValues.count_geki}/` : ""}${hitValues.count_300}**/${score.ruleset_id === 3 ?
            `${hitValues.count_katu}/`
            : ""}${hitValues.count_100}/${score.ruleset_id === 1 ? "" : `${hitValues.count_50}/`}${hitValues.count_miss} }`;

        const textRow1 = `**#${i + 1}** ${grades[score.rank]} **${userLink} \`${mods.join("") === "" ? "+NM" : `+${mods.join("")}`}\` __[${performance.maxPerf.difficulty.stars.toFixed(2)}★]__**\n`;
        const textRow2 = `>> **${performance.curPerf.pp.toFixed(2)}**/${performance.maxPerf.pp.toFixed(2)}pp • (${(score.accuracy * 100).toFixed(2)}%) • ${score.total_score.toLocaleString()}\n`;
        const textRow3 = `>> [${score.max_combo}x/${map.maxCombo}x] ${accValues} <t:${new Date(score.ended_at).getTime() / 1000}:R>`;
        description.push(textRow1 + textRow2 + textRow3);
    }

    let userScore = "";
    if (initializer?.score) {
        const { score } = initializer;
        const mods = score.mods.length > 0 ? score.mods.map((mod) => mod.acronym) : [""];
        const stats = score.statistics;
        const hitValues = { count_300: stats.great ?? 0, count_100: stats.ok ?? 0, count_50: stats.meh ?? 0, count_miss: stats.miss ?? 0, count_geki: stats.perfect ?? 0, count_katu: stats.good ?? 0 };
        const performance = getPerformanceDetails({ mapText: file, maxCombo: score.max_combo, modsArg: mods, rulesetId: map.rulesetId, hitValues });

        userScore = `\n\n**__${locale.embeds.leaderboard.playScore(initializer.user.id)}__**
**#${initializer.index + 1} [${score.user.username}](https://osu.ppy.sh/users/${score.user.id})**: ${score.total_score.toLocaleString()} [**${score.max_combo}x**/${map.maxCombo}x] **+${mods.join("")}**
${grades[score.rank]} **${performance.curPerf.pp.toFixed(2)}**/${performance.maxPerf.pp.toFixed(2)}pp (${
    (score.accuracy * 100).toFixed(2)
}%) <t:${new Date(score.ended_at).getTime() / 1000}:R>`;
    }

    return new EmbedBuilder()
        .setTitle(`${map.artist} - ${map.title}`)
        .setURL(`https://osu.ppy.sh/b/${map.id}`)
        .setImage(map.background)
        .setDescription(description.join("\n") + userScore)
        .setFooter({ text: `${locale.embeds.page(`${page + 1}/${Math.ceil(plays.length / 5)}`)} - ${locale.misc.poweredBy}` });
}
