import { parseOsuArguments } from "@utils/args";
import { mapBuilder } from "@builders/map";
import { getBeatmapIdFromContext } from "@utils/osu";
import { Mode } from "@type/osu";
import { EmbedBuilderType } from "@type/builders";
import { EmbedType } from "lilybird";
import type { Mod } from "osu-web.js";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

export default {
    name: "beatmap",
    aliases: ["beatmap", "map", "m"],
    description: "Display statistics of a beatmap.",
    usage: "/map",
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({ message, args, channel }: { message: Message; args: Array<string>; channel: GuildTextChannel }): Promise<void> {
    const { user, mods } = parseOsuArguments(message, args, Mode.OSU);

    const beatmapId = user.beatmapId ?? (await getBeatmapIdFromContext({ message, client: message.client }));
    if (typeof beatmapId === "undefined" || beatmapId === null) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: "It seems like the beatmap ID couldn't be found :(\n",
                },
            ],
        });
        return;
    }

    const embeds = await mapBuilder({
        type: EmbedBuilderType.MAP,
        initiatorId: message.author.id,
        beatmapId: Number(beatmapId),
        mods: (mods.name?.match(/.{1,2}/g) as Array<Mod> | null) ?? null,
    });
    await channel.send({ embeds });
}
