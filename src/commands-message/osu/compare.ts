import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { compareBuilder } from "../../embed-builders/compare";
import { Mode } from "../../types/osu";
import { UserType } from "../../types/commandArgs";
import { getBeatmapIdFromContext } from "../../utils/osu";
import { EmbedType } from "lilybird";
import type { Message } from "lilybird";
import type { MessageCommand } from "../../types/commands";

const modeAliases: Record<string, { mode: Mode }> = {
    c: { mode: Mode.OSU },
    gap: { mode: Mode.OSU },
    compare: { mode: Mode.OSU },
    compareosu: { mode: Mode.OSU },
    comparetaiko: { mode: Mode.TAIKO },
    comparemania: { mode: Mode.MANIA },
    comparecatch: { mode: Mode.FRUITS }
};

async function run({ message, args, commandName }: { message: Message, args: Array<string>, commandName: string }): Promise<void> {
    const channel = await message.fetchChannel();

    const { user, mods } = parseOsuArguments(message, args, modeAliases[commandName].mode);
    if (user.type === UserType.FAIL) {
        await channel.send(user.failMessage);
        return;
    }

    const osuUser = await client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } });
    if (!osuUser.id) {
        await channel.send("This user does not exist.");
        return;
    }

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

    const embeds = await compareBuilder({ user: osuUser, mode: user.mode, beatmapId: Number(beatmapId), mods });
    await channel.send({ embeds });
}

export default {
    name: "compare",
    aliases: Object.keys(modeAliases),
    description: "Display play(s) of a user on a beatmap.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
