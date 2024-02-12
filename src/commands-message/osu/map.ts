import { parseOsuArguments } from "../../utils/args";
import { mapBuilder } from "../../embed-builders/mapBuilder";
import { getBeatmapIdFromContext } from "../../utils/osu";
import { Mode } from "../../types/osu";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { EmbedType } from "lilybird";
import type { Mod } from "osu-web.js";
import type { Message } from "lilybird";
import type { MessageCommand } from "../../types/commands";

async function run({ message, args }: { message: Message, args: Array<string> }): Promise<void> {
    const channel = await message.fetchChannel();

    const { user, mods } = parseOsuArguments(message, args, Mode.OSU);

    const beatmapId = user.beatmapId ?? await getBeatmapIdFromContext({ message, client: message.client });
    if (typeof beatmapId === "undefined" || beatmapId === null) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: "It seems like the beatmap ID couldn't be found :(\n"
                }
            ]
        });
        return;
    }

    const embeds = await mapBuilder({ builderType: EmbedBuilderType.MAP, beatmapId: Number(beatmapId), mods: <Array<Mod> | null>mods.name?.match(/.{1,2}/g) ?? null });
    await channel.send({ embeds });
}

export default {
    name: "beatmap",
    aliases: ["beatmap", "map", "m"],
    description: "Display statistics of a beatmap.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
