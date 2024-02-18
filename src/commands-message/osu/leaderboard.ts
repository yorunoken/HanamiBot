import { parseOsuArguments } from "../../utils/args";
import { Mode } from "../../types/osu";
import { getBeatmapIdFromContext, getBeatmapTopScores } from "../../utils/osu";
import { leaderboardBuilder } from "../../embed-builders/leaderboard";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { mesageDataForButtons } from "../../utils/cache";
import { client } from "../../utils/initalize";
import { calculateButtonState, createActionRow } from "../../utils/buttons";
import { EmbedType } from "lilybird";
import type { Mod } from "osu-web.js";
import type { LeaderboardBuilderOptions } from "../../types/embedBuilders";
import type { Message } from "lilybird";
import type { MessageCommand } from "../../types/commands";

const modeAliases: Record<string, { isGlobal: boolean }> = {
    leaderboard: { isGlobal: true },
    lb: { isGlobal: true },
    countryleaderboard: { isGlobal: false },
    countrylb: { isGlobal: false },
    clb: { isGlobal: false },
    ct: { isGlobal: false }

};

export default {
    name: "leaderboard",
    aliases: Object.keys(modeAliases),
    description: "Display the leaderboard of a beatmap.",
    cooldown: 1000,
    run
} satisfies MessageCommand;

async function run({ message, args, commandName }: { message: Message, args: Array<string>, commandName: string }): Promise<void> {
    const channel = await message.fetchChannel();

    const { isGlobal } = modeAliases[commandName];
    const { user, mods, flags } = parseOsuArguments(message, args, Mode.OSU);

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

    const beatmap = await client.beatmaps.getBeatmap(Number(beatmapId));
    if (!beatmap.id) {
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

    const { scores } = await getBeatmapTopScores({
        beatmapId: Number(beatmapId),
        mode: beatmap.mode,
        isGlobal,
        mods: mods.name ? <Array<Mod>>mods.name.match(/.{1,2}/g) : undefined
    });

    if (scores.length === 0) {
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

    const page = Number(flags.p ?? flags.page) || 0;
    const totalPages = Math.ceil(scores.length / 5);

    const embedOptions: LeaderboardBuilderOptions = {
        type: EmbedBuilderType.LEADERBOARD,
        page: page,
        beatmap,
        scores
    };

    const embeds = await leaderboardBuilder(embedOptions);

    const sentMessage = await channel.send({
        embeds,
        components: createActionRow({
            isPage: true,
            disabledStates: [
                page === 0,
                calculateButtonState(false, page, totalPages),
                calculateButtonState(true, page, totalPages),
                page === totalPages - 1
            ]
        })
    });

    mesageDataForButtons.set(sentMessage.id, embedOptions);
}

