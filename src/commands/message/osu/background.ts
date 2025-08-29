import { parseOsuArguments } from "@utils/args";
import { getBeatmapIdFromContext } from "@utils/osu";
import { Mode } from "@type/osu";
import { EmbedBuilderType } from "@type/builders";
import { client } from "@utils/initalize";
import { backgroundBuilder } from "@builders";
import { EmbedType } from "lilybird";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

export default {
    name: "background",
    aliases: ["bg", "background"],
    description: "Display background of a beatmap.",
    usage: "/background",
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({ message, args, channel }: { message: Message; args: Array<string>; channel: GuildTextChannel }): Promise<void> {
    const { user } = parseOsuArguments(message, args, Mode.OSU);

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

    const beatmapRequest = await client.safeParse(client.beatmaps.getBeatmap(Number(beatmapId)));
    if (!beatmapRequest.success) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: "It seems like this beatmap doesn't exist! :(",
                },
            ],
        });
        return;
    }
    const beatmap = beatmapRequest.data;

    const embeds = backgroundBuilder({
        type: EmbedBuilderType.BACKGROUND,
        initiatorId: message.author.id,
        beatmap,
    });
    await channel.send({ embeds });
}
