import { parseOsuArguments } from "@utils/args";
import { getBeatmapUserScores } from "@utils/score-api";
import { client } from "@utils/initalize";
import { compareBuilder } from "@builders";
import { Mode } from "@type/osu";
import { UserType } from "@type/command-args";
import { getBeatmapIdFromContext } from "@utils/osu";
import { EmbedBuilderType } from "@type/builders";
import { createPaginationActionRow } from "@utils/pagination";
import { ButtonStateCache } from "@utils/cache";
import { EmbedType } from "lilybird";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

const modeAliases: Record<string, { mode: Mode }> = {
    შედარება: { mode: Mode.OSU },
    mog: { mode: Mode.OSU },
    gap: { mode: Mode.OSU },
    c: { mode: Mode.OSU },
    compare: { mode: Mode.OSU },
    compareosu: { mode: Mode.OSU },
    comparetaiko: { mode: Mode.TAIKO },
    comparemania: { mode: Mode.MANIA },
    comparecatch: { mode: Mode.FRUITS },
};

export default {
    name: "compare",
    aliases: Object.keys(modeAliases),
    description: "Display play(s) of a user on a beatmap.",
    usage: "/compare",
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({ message, args, commandName, channel }: { message: Message; args: Array<string>; commandName: string; channel: GuildTextChannel }): Promise<void> {
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
                    description: `It seems like the user **\`${user.banchoId}\`** doesn't exist! :("`,
                },
            ],
        });
        return;
    }
    const osuUser = osuUserRequest.data;

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

    if (beatmap.status === "pending" || beatmap.status === "wip" || beatmap.status === "graveyard") {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: "It seems like this beatmap's leaderboard doesn't exist! :(",
                },
            ],
        });
        return;
    }

    const plays = await getBeatmapUserScores(beatmap.id, osuUser.id, { query: { mode: user.mode } }, user.authorDb);

    if (plays.length === 0) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like \`${osuUser.username}\` has no plays on that beatmap!`,
                },
            ],
        });
        return;
    }

    const embedOptions = {
        type: EmbedBuilderType.COMPARE as EmbedBuilderType.COMPARE,
        initiatorId: message.author.id,
        user: osuUser,
        mode: user.mode,
        beatmap,
        plays,
        mods,
        page: 0,
    };

    const embeds = await compareBuilder(embedOptions);
    const sentMessage = await channel.send({
        embeds,
        components: createPaginationActionRow(embedOptions),
    });
    await ButtonStateCache.set(sentMessage.id, embedOptions);
}
