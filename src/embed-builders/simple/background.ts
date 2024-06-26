import type { Embed } from "lilybird";
import type { BackgroundBuilderOptions } from "@type/embedBuilders";

export function backgroundBuilder({ beatmap }: BackgroundBuilderOptions): Array<Embed.Structure> {
    const { beatmapset } = beatmap;
    return [
        {
            author: { name: `${beatmapset.artist} - ${beatmapset.title} by ${beatmapset.creator}`, icon_url: `https://s.ppy.sh/a/${beatmapset.user_id}`, url: `https://osu.ppy.sh/beatmaps/${beatmapset.id}` },
            image: { url: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/raw.jpg` }
        }
    ];
}
