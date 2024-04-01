import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { compareBuilder } from "../../embed-builders/compare";
import { Mode } from "../../types/osu";
import { UserType } from "../../types/commandArgs";
import { getBeatmapIdFromContext } from "../../utils/osu";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { EmbedType } from "lilybird";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "../../types/commands";

const modeAliases: Record<string, { mode: Mode }> = {
    შედარება: { mode: Mode.OSU },
    mog: { mode: Mode.OSU },
    gap: { mode: Mode.OSU },
    c: { mode: Mode.OSU },
    compare: { mode: Mode.OSU },
    compareosu: { mode: Mode.OSU },
    comparetaiko: { mode: Mode.TAIKO },
    comparemania: { mode: Mode.MANIA },
    comparecatch: { mode: Mode.FRUITS }
};

export default {
    name: "compare",
    aliases: Object.keys(modeAliases),
    description: "Display play(s) of a user on a beatmap.",
    cooldown: 1000,
    run
} satisfies MessageCommand;

async function run({
    message,
    args,
    commandName,
    channel
}: {
    message: Message,
    args: Array<string>,
    commandName: string,
    channel: GuildTextChannel
}): Promise<void> {
    const { user, mods } = parseOsuArguments(message, args, modeAliases[commandName].mode);
    if (user.type === UserType.FAIL) {
        await channel.send(user.failMessage);
        return;
    }

    const osuUserRequest = await client.safeParse(client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } }));
    if (!osuUserRequest.success) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like the user **\`${user.banchoId}\`** doesn't exist! :("`
                }
            ]
        });
        return;
    }
    const osuUser = osuUserRequest.data;

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
                    description: "It seems like this beatmap doesn't exist! :("
                }
            ]
        });
        return;
    }
    const beatmap = beatmapRequest.data;

    if (beatmap.status === "pending" || beatmap.status === "wip" || beatmap.status === "graveyard") {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: "It seems like this beatmap's leaderboard doesn't exist! :("
                }
            ]
        });
        return;
    }

    const plays = (await client.beatmaps.getBeatmapUserScores(beatmap.id, osuUser.id, { query: { mode: user.mode } })).sort((a, b) => b.pp - a.pp).map((item, idx) => {
        return { ...item, position: idx + 1 };
    });

    if (plays.length === 0) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like \`${osuUser.username}\` has no plays on that beatmap!`
                }
            ]
        });
        return;
    }

    const embeds = await compareBuilder({
        type: EmbedBuilderType.COMPARE,
        initiatorId: message.author.id,
        user: osuUser,
        mode: user.mode,
        beatmap,
        plays,
        mods
    });
    await channel.send({ embeds });
}

