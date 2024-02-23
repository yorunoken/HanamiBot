import { client } from "../utils/initalize";
import { downloadBeatmap, getPerformanceResults } from "../utils/osu";
import { getMap } from "../utils/database";
import { rulesets } from "../utils/emotes";
import { EmbedType } from "lilybird";
import type { MapBuilderOptions } from "../types/embedBuilders";
import type { EmbedStructure } from "lilybird";

export async function mapBuilder({
    beatmapId,
    mods
}: MapBuilderOptions): Promise<Array<EmbedStructure>> {
    const beatmapRequest = await client.safeParse(client.beatmaps.getBeatmap(Number(beatmapId)));
    if (!beatmapRequest.success) {
        return [
            {
                type: EmbedType.Rich,
                title: "Uh oh! :x:",
                description: `It seems like this beatmap couldn't be found :(`
            }
        ];
    }
    const map = beatmapRequest.data;

    const { beatmapset: mapset, mode, version } = map;

    const mapData = getMap(beatmapId)?.data ?? (await downloadBeatmap([beatmapId]))[0].contents;
    const performances = await Promise.all([98, 97, 95].map(async (accuracy) => getPerformanceResults({ beatmapId, setId: map.mode_int, mapData, accuracy, mods: mods ?? 0 })));
    const [a98, a97, a95] = performances;

    const drainLengthInSeconds = map.total_length / (a98?.mapValues.clockRate ?? 1);
    const drainMinutes = Math.floor(drainLengthInSeconds / 60);
    const drainSeconds = Math.ceil(drainLengthInSeconds % 60);

    const objects = map.count_circles + map.count_sliders + map.count_spinners;

    const infoField = [
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `**Stars:** **\`${a98?.currentPerformance.difficulty.stars.toFixed(2)}\`** **Mods:** \`+${mods ?? "NM"}\` **BPM:** \`${a98?.mapValues.bpm.toFixed(0)}\``,
        `**Length:** \`${drainMinutes}:${drainSeconds}\` **Max Combo:** \`${a98?.currentPerformance.difficulty.maxCombo}\` **Objects:** \`${objects.toLocaleString()}\``,
        `**AR:** \`${a98?.mapValues.ar.toFixed(1)}\` **OD:** \`${a98?.mapValues.od.toFixed(1)}\` **CS:** \`${a98?.mapValues.cs.toFixed(1)}\` **HP:** \`${a98?.mapValues.hp.toFixed(1)}\``,
        `\n:heart: **${mapset.favourite_count.toLocaleString()}** :play_pause: **${mapset.play_count.toLocaleString()}**`
    ];

    const ppField = [
        "```Acc  |  PP",
        `100% ${a98?.perfectPerformance.pp.toFixed(2)}`,
        `98%  ${a98?.currentPerformance.pp.toFixed(2)}`,
        `97%  ${a97?.currentPerformance.pp.toFixed(2)}`,
        `95%  ${a95?.currentPerformance.pp.toFixed(2)}\`\`\``
    ];

    const linksField = [
        `<:chimu:1117792339549761576>[Chimu](https://chimu.moe/d/${map.beatmapset_id})`,
        `<:beatconnect:1075915329512931469>[Beatconnect](https://beatconnect.io/b/${map.beatmapset_id})`,
        `:notes:[Song Preview](https://b.ppy.sh/preview/${map.beatmapset_id}.mp3)`,
        `🖼️[Full Background](https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/raw.jpg)`
    ];

    return [
        {
            title: `${mapset.artist} - ${mapset.title}`,
            url: `https://osu.ppy.sh/b/${beatmapId}`,
            thumbnail: { url: `https://assets.ppy.sh/beatmaps/${mapset.id}/covers/list.jpg` },
            author: { name: `${mapset.status.charAt(0).toUpperCase()}${mapset.status.slice(1)} mapset by ${mapset.creator}`, icon_url: `https://a.ppy.sh/${mapset.user_id}` },
            fields: [
                {
                    name: `${rulesets[mode]} ${version}`,
                    value: infoField.join("\n"),
                    inline: false
                },
                { name: "PP", value: ppField.join("\n"), inline: true },
                { name: "Links", value: linksField.join("\n"), inline: true }
            ]
        }
    ];
}
