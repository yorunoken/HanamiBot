import { client } from "../utils/initalize";
import { getScore } from "../cleaners/scores";
import { SPACE } from "../utils/constants";
import { getMap } from "../utils/database";
import { downloadBeatmap, getBeatmapTopScores } from "../utils/osu";
import { EmbedType } from "lilybird";
import type { EmbedStructure } from "lilybird";
import type { Beatmap, Leaderboard, LeaderboardScores, Mode, ScoresInfo } from "../types/osu";
import type { Mod } from "osu-web.js";

export async function leaderboardBuilder({ type, beatmapId, mods, page = 0 }:
{
    type: Leaderboard,
    beatmapId: number,
    mods?: {
        exclude: null | boolean,
        include: null | boolean,
        forceInclude: null | boolean,
        name: null | Mod
    },
    page: number | undefined
}): Promise<Array<EmbedStructure>> {
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
                description: "It seems like this beatmap's leaderboard doesn't exist! :("
            }
        ] satisfies Array<EmbedStructure>;
    }

    const { scores } = await getBeatmapTopScores({ beatmapId, mode: beatmap.mode, type, mods: mods ? mods.name?.match(/.{1,2}/g) as Array<Mod> : undefined });

    if (scores.length === 0) {
        return [
            {
                type: EmbedType.Rich,
                title: "Uh oh! :x:",
                description: "No scores yet. Maybe you should try setting some? :)"
            }
        ] satisfies Array<EmbedStructure>;
    }

    return getPlays(scores, beatmap, page);
}

async function getPlays(plays: LeaderboardScores, beatmap: Beatmap, page: number): Promise<Array<EmbedStructure>> {
    const beatmapId = beatmap.id;
    const mode: Mode = beatmap.mode as Mode;
    const mapData = getMap(beatmapId)?.data ?? (await downloadBeatmap([beatmapId]))[0].contents;

    const pageStart = page * 5;
    const pageEnd = pageStart + 5;

    const playsTemp: Array<Promise<ScoresInfo>> = [];
    for (let i = pageStart; pageEnd > i && i < plays.length; i++) playsTemp.push(getScore({ scores: plays, index: i, mode, beatmap, mapData }));

    const { beatmapset } = beatmap;
    const embed: EmbedStructure = {
        type: EmbedType.Rich,
        title: `${beatmapset.artist} - ${beatmapset.title} [${beatmap.version}]`,
        url: `https://osu.ppy.sh/b/${beatmap.id}`,
        thumbnail: { url: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/list.jpg` },
        description: (await Promise.all(playsTemp))
            .map((play) => {
                const line1 = `${play.grade} ${SPACE} **[${play.user}](https://osu.ppy.sh/u/${play.userId}) ${SPACE} [${play.stars}]** ${SPACE} +${play.mods.join("")}\n`;
                const line2 = `${play.ppFormatted} ${SPACE} **${play.accuracy}% ${SPACE} ${play.score}**\n`;
                const line3 = `${play.hitValues} ${SPACE} ${play.comboValues} ${SPACE} ${play.playSubmitted}`;

                return line1 + line2 + line3;
            })
            .join("\n"),
        footer: { text: `${beatmap.status.charAt(0).toUpperCase()}${beatmap.status.slice(1)} beatmapset by ${beatmap.beatmapset.creator}` }
    };

    return [embed] satisfies Array<EmbedStructure>;
}
