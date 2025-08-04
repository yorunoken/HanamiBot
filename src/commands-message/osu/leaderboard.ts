import { parseOsuArguments } from "@utils/args";
import { Mode } from "@type/osu";
import { getBeatmapIdFromContext, getBeatmapTopScores } from "@utils/osu";
import { leaderboardBuilder } from "@builders/leaderboard";
import { EmbedBuilderType } from "@type/embedBuilders";
import { ButtonStateCache } from "@utils/cache";
import { client } from "@utils/initalize";
import { createPaginationActionRow } from "@utils/pagination";
import { EmbedType } from "lilybird";
import type { Mod } from "osu-web.js";
import type { LeaderboardBuilderOptions } from "@type/embedBuilders";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

const modeAliases: Record<string, { isGlobal: boolean }> = {
    leaderboard: { isGlobal: true },
    lb: { isGlobal: true },
    countryleaderboard: { isGlobal: false },
    countrylb: { isGlobal: false },
    clb: { isGlobal: false },
    ct: { isGlobal: false },
};

export default {
    name: "leaderboard",
    aliases: Object.keys(modeAliases),
    description: "Display the leaderboard of a beatmap.",
    details: "Only `leaderboard` and `lb` aliases are used for global commands. The rest of the aliases are for Turkish leaderboards.",
    usage: "/leaderboard",
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({ message, args, commandName, channel }: { message: Message; args: Array<string>; commandName: string; channel: GuildTextChannel }): Promise<void> {
    const { isGlobal } = modeAliases[commandName];
    const { user, mods, flags } = parseOsuArguments(message, args, Mode.OSU);

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

    const { scores } = await getBeatmapTopScores({
        beatmapId: Number(beatmapId),
        mode: beatmap.mode,
        isGlobal,
        mods: mods.name ? (mods.name.match(/.{1,2}/g) as Array<Mod>) : undefined,
    });

    if (scores.length === 0) {
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

    const page = Number(flags.p ?? flags.page ?? 1) - 1;

    const embedOptions: LeaderboardBuilderOptions = {
        type: EmbedBuilderType.LEADERBOARD,
        initiatorId: message.author.id,
        page: page,
        beatmap,
        scores,
    };

    const embeds = await leaderboardBuilder(embedOptions);

    const sentMessage = await channel.send({
        embeds,
        components: createPaginationActionRow(embedOptions),
    });

    await ButtonStateCache.set(sentMessage.id, embedOptions);
}
