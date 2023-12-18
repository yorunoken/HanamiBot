import { downloadMap, formatNumber, getPerformanceDetails, getRetryCount, grades, insertData, osuEmojis, rulesets } from "./utils";
import { tools, v2 } from "osu-api-extended";
import type { response as BeatmapResponse } from "osu-api-extended/dist/types/v2_beatmap_id_details";
import type { response as ScoreResponseCompare } from "osu-api-extended/dist/types/v2_scores_user_beatmap";
import type { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import type { response as UserOsu } from "osu-api-extended/dist/types/v2_user_details";
import type { BeatmapInfo, Locales, osuModes, ScoreInfo, UserInfo } from "./Structure/index";

export function getUser({ user, mode, locale }: { user: UserOsu, mode: osuModes, locale: Locales }): UserInfo {
    const stats = user.statistics;
    const userJoinDate = new Date(user.join_date);

    return {
        locale,
        username: user.username,
        userCover: user.cover_url,
        userAvatar: user.avatar_url,
        userUrl: `https://osu.ppy.sh/users/${user.id}/${mode}`,
        coverUrl: user.cover_url,
        userFlag: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
        countryCode: user.country.code,
        globalRank: stats.global_rank.toLocaleString() || "-",
        countryRank: stats.country_rank.toLocaleString() || "-",
        pp: stats.pp.toLocaleString(),
        rankedScore: stats.ranked_score.toLocaleString(),
        totalScore: stats.total_score.toLocaleString(),
        objectsHit: stats.total_hits.toLocaleString(),
        occupation: `**${locale.classes.occupation}:**\n \`${user.occupation}\`\n`,
        interest: `**${locale.classes.interests}:**\n \`${user.interests}\`\n`,
        location: `**${locale.classes.location}:**\n \`${user.location}\``,
        highestRank: user.rank_highest.rank.toLocaleString() || undefined,
        highestRankTime: new Date(user.rank_highest.updated_at).getTime() / 1000 || undefined,
        recommendedStarRating: (Math.pow(stats.pp, 0.4) * 0.195).toFixed(2),
        userJoinedAgo: (Math.floor((Date.now() - userJoinDate.valueOf()) / (1000 * 60 * 60 * 24 * 30)) / 12).toFixed(1),
        formattedDate: userJoinDate.toLocaleDateString(locale.code, {
            hour: "2-digit",
            minute: "2-digit",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            timeZone: "UTC"
        }),
        accuracy: stats.hit_accuracy.toFixed(2),
        level: `${user.statistics.level.current}.${stats.level.progress.toString(10).padStart(2, "0")}`,
        playCount: stats.play_count.toLocaleString(),
        playHours: (stats.play_time / 3600).toFixed(0),
        followers: user.follower_count.toLocaleString(),
        maxCombo: stats.maximum_combo.toLocaleString(),
        rankS: stats.grade_counts.s.toLocaleString(),
        rankA: stats.grade_counts.a.toLocaleString(),
        rankSs: stats.grade_counts.ss.toLocaleString(),
        rankSh: stats.grade_counts.sh.toLocaleString(),
        rankSsh: stats.grade_counts.ssh.toLocaleString(),
        emoteA: grades.A,
        emoteS: grades.S,
        emoteSh: grades.SH,
        emoteSs: grades.X,
        emoteSsh: grades.XH
    };
}

export async function getScore({ plays, index, mode, isCompare, beatmap, file, locale }:
{ plays: Array<ScoreResponse | ScoreResponseCompare>, index: number, mode: osuModes, isCompare?: boolean, beatmap?: BeatmapResponse, file?: string, locale: Locales }): Promise<ScoreInfo> {
    const play = plays[index];
    const rulesetId = rulesets[mode];

    const playScore = play as ScoreResponse;

    const map = beatmap ?? playScore.beatmap;

    const mapset = beatmap?.beatmapset ?? playScore.beatmapset;

    if (!file || !["ranked", "loved", "approved"].includes(map.status)) {
        file = (await downloadMap(map.id) as string);
        insertData({ table: "maps", id: map.id.toString(), data: [ { name: "data", value: file } ] });
    }

    const { id: beatmapId, count_circles: circles, count_sliders: sliders, count_spinners: spinners, hit_length: hLength, version } = map;
    const { user_id: creatorId, creator: creatorUsername, status: mapStatus, id: mapsetId, artist, title } = mapset;
    const { count_100: count100, count_300: count300, count_50: count50, count_geki: countGeki, count_katu: countKatu, count_miss: countMiss } = play.statistics;

    const objectshit = count300 + count100 + count50 + countMiss;
    const objects = circles + sliders + spinners;
    const percentageNum = Number(objectshit / objects * 100);

    const modsPlay = play.mods.length > 0 ? `**+${play.mods.join("").toUpperCase()}**` : "**+NM**";

    let hitLength = hLength;
    let totalLength = hLength;
    if (modsPlay.toLowerCase().includes("dt")) {
        hitLength /= 1.5;
        totalLength /= 1.5;
    }

    const performance = getPerformanceDetails({
        modsArg: play.mods,
        maxCombo: play.max_combo,
        rulesetId,
        hitValues: {
            count_100: count100,
            count_300: count300,
            count_50: count50,
            count_geki: countGeki,
            count_katu: countKatu,
            count_miss: countMiss
        },
        mapText: file
    });

    let globalPlacement = "";
    if (play.passed && play.best_id) {
        const scoreGlobal = await v2.scores.details(play.best_id, mode);
        if (scoreGlobal.rank_global < 10000)
            globalPlacement = `**__${locale.classes.globalRank} #${scoreGlobal.rank_global}:__**`;
    }

    const accValues = `{ **${rulesetId === 3 ? `${countGeki}/` : ""}${count300}**/${rulesetId === 3 ? `${countKatu}/` : ""}${count100}/${rulesetId === 1 ? "" : `${count50}/`}${countMiss} }`;
    return {
        performance,
        retries: isCompare ? undefined : getRetryCount((plays as Array<ScoreResponse>).map((x) => x.beatmap.id).splice(index, plays.length), beatmapId),
        percentagePassed: percentageNum === 100 || play.passed ? "" : `@${percentageNum.toFixed(1)}% `,
        modsPlay,
        beatmapId,
        globalPlacement,
        countCircles: circles,
        countSliders: sliders,
        countSpinners: spinners,
        hitLength,
        placement: isCompare ? undefined : playScore.position,
        version: version,
        creatorId: creatorId,
        creatorUsername: creatorUsername,
        mapStatus: locale.embeds.map[mapStatus as "ranked" | "qualified" | "loved" | "pending" | "graveyard"],
        mapsetId: mapsetId,
        count100: count100,
        count300: count300,
        count50: count50,
        countGeki: countGeki,
        countKatu: countKatu,
        countMiss: countMiss,
        totalScore: play.score.toLocaleString(),
        accuracy: `${Number(play.accuracy * 100).toFixed(2)}%`,
        artist: artist,
        title: title,
        grade: grades[play.rank],
        submittedTime: new Date(play.created_at).getTime() / 1000,
        minutesTotal: Math.floor(totalLength / 60).toFixed(),
        secondsTotal: (totalLength % 60).toFixed().toString().padStart(2, "0"),
        bpm: performance.mapValues.bpm.toFixed(),
        mapValues:
        `AR: ${formatNumber(performance.mapValues.ar, 1)} OD: ${formatNumber(performance.mapValues.od, 1)} CS: ${formatNumber(performance.mapValues.cs, 1)} HP: ${formatNumber(performance.mapValues.hp, 2)}`,
        stars: performance.maxPerf.difficulty.stars.toFixed(2),
        accValues,
        comboValue: `[ **${play.max_combo}**x/${performance.maxPerf.difficulty.maxCombo}x ]`,
        pp: performance.curPerf.pp.toFixed(2),
        fcPp: performance.fcPerf.pp.toFixed(2),
        ssPp: performance.maxPerf.pp.toFixed(2),
        totalResult:
        `**${performance.curPerf.pp.toFixed(2)}**/${performance.maxPerf.pp.toFixed(2)}pp • ${play.max_combo}x/${performance.maxPerf.difficulty.maxCombo}x • ${accValues}`,
        ifFcValue: performance.curPerf.effectiveMissCount > 0
            ? locale.classes.ifFc(
                `**${
                    tools
                        .accuracy({
                            count300: (objects - count100 - count50).toString(),
                            geki: countGeki.toString(),
                            count100: count100.toString(),
                            katu: countKatu.toString(),
                            count50: count50.toString(),
                            count0: "0",
                            mode
                        })
                        .toFixed(2)
                }%**`,
                `**${performance.fcPerf.pp.toFixed(2)}**`
            )
            : ""
    };
}

export function getBeatmap(map: BeatmapResponse, valueOptions: { mods: Array<string>, accuracy?: number, ar?: number, od?: number, cs?: number }, file: string, locale: Locales): BeatmapInfo {
    const set = map.beatmapset;
    const rulesetId = rulesets[map.mode];

    const performance: Record<number, ReturnType<typeof getPerformanceDetails>> = {};
    [100, 99, 98, 95].forEach((accuracy) => {
        performance[accuracy] = getPerformanceDetails({
            modsArg: valueOptions.mods,
            maxCombo: map.max_combo,
            rulesetId: rulesetId,
            hitValues: {},
            accuracy: accuracy,
            mapText: file
        });
    });

    const mods = `+${valueOptions.mods.join("")}`;

    const totalLength = ["DT", "NC"].includes(mods.toUpperCase()) ? map.hit_length / 1.5 : map.hit_length;

    return {
        title: set.title,
        artist: set.artist,
        version: map.version,
        mode: map.mode,
        id: map.id,
        setId: map.beatmapset_id,
        creator: map.beatmapset.creator,
        rulesetId: rulesetId,
        totalObjects: map.count_circles + map.count_sliders + map.count_spinners,
        stars: performance[100].maxPerf.difficulty.stars.toFixed(2),
        mods,
        bpm: performance[100].mapValues.bpm.toFixed(),
        totalLength,
        mapLength: `${Math.floor(totalLength / 60).toFixed()}:${(totalLength % 60).toFixed().toString().padStart(2, "0")}`,
        maxCombo: map.max_combo,
        ar: ["taiko", "mania"].includes(map.mode) ? "-" : performance[100].mapValues.ar.toFixed(1),
        od: performance[100].mapValues.od.toFixed(1),
        hp: performance[100].mapValues.hp.toFixed(1),
        cs: ["taiko", "mania"].includes(map.mode) ? "-" : performance[100].mapValues.ar.toFixed(2),
        favorited: map.beatmapset.favourite_count.toLocaleString(),
        playCount: map.beatmapset.play_count.toLocaleString(),
        ppValues: `\`\`\`Acc | PP
100%: ${performance[100].fcPerf.pp.toFixed()}pp
99%:  ${performance[99].fcPerf.pp.toFixed()}pp
98%:  ${performance[98].fcPerf.pp.toFixed()}pp
95%:  ${performance[95].fcPerf.pp.toFixed()}pp\`\`\``,
        links:
      `<:chimu:1117792339549761576>[Chimu](https://chimu.moe/d/${map.beatmapset_id})
<:beatconnect:1075915329512931469>[Beatconnect](https://beatconnect.io/b/${map.beatmapset_id})
:notes:[${locale.classes.songPreview}](https://b.ppy.sh/preview/${map.beatmapset_id}.mp3)
🎬[${locale.classes.mapPreview}](https://osu.pages.dev/preview#${map.id})
🖼️[${locale.classes.fullBackground}](https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/raw.jpg)`,
        background: `https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/cover.jpg`,

        updatedAt: `${locale.classes[map.status as "ranked" | "qualified" | "loved"]} ${
            new Date(map.last_updated).toLocaleDateString(locale.code, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            })
        }`,
        modeEmoji: osuEmojis[map.mode]
    };
}
