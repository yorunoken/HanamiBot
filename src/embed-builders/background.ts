import type { EmbedStructure } from "lilybird";
import type { BackgroundBuilderOptions } from "../types/embedBuilders";

export function backgroundBuilder({ beatmap }: BackgroundBuilderOptions): Array<EmbedStructure> {
    const { beatmapset } = beatmap;
    return [
        {
            author: { name: `${beatmapset.artist} - ${beatmapset.title} by ${beatmapset.creator}`, icon_url: `https://s.ppy.sh/a/${beatmapset.user_id}`, url: `https://osu.ppy.sh/beatmaps/${beatmapset.id}` },
            image: { url: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/raw.jpg` }
        }
    ];
}
