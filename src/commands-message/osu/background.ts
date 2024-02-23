import { parseOsuArguments } from "../../utils/args";
import { getBeatmapIdFromContext } from "../../utils/osu";
import { Mode } from "../../types/osu";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { client } from "../../utils/initalize";
import { backgroundBuilder } from "../../embed-builders/background";
import { EmbedType } from "lilybird";
import type { Message } from "lilybird";
import type { MessageCommand } from "../../types/commands";

export default {
    name: "background",
    aliases: ["bg", "background"],
    description: "Display background of a beatmap.",
    cooldown: 1000,
    run
} satisfies MessageCommand;

async function run({ message, args }: { message: Message, args: Array<string> }): Promise<void> {
    const channel = await message.fetchChannel();

    const { user } = parseOsuArguments(message, args, Mode.OSU);

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

    const beatmapRequest = await client.safeParse(client.beatmaps.getBeatmap(Number(beatmapId)));
    if (!beatmapRequest.success) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like this beatmap doesn't exist! :(`
                }
            ]
        });
        return;
    }
    const beatmap = beatmapRequest.data;

    const embeds = backgroundBuilder({
        type: EmbedBuilderType.BACKGROUND,
        initiatorId: message.author.id,
        beatmap
    });
    await channel.send({ embeds });
}
