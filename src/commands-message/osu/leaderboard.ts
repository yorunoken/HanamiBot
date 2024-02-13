import { parseOsuArguments } from "../../utils/args";
import { Mode, Leaderboard } from "../../types/osu";
import { getBeatmapIdFromContext } from "../../utils/osu";
import { leaderboardBuilder } from "../../embed-builders/leaderboard";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { mesageDataForButtons } from "../../utils/cache";
import { EmbedType, ComponentType, ButtonStyle } from "lilybird";
import type { LeaderboardBuilderOptions } from "../../types/embedBuilders";
import type { Message } from "lilybird";
import type { MessageCommand } from "../../types/commands";

const modeAliases: Record<string, { type: Leaderboard }> = {
    leaderboard: { type: Leaderboard.GLOBAL },
    lb: { type: Leaderboard.GLOBAL },
    countryleaderboard: { type: Leaderboard.COUNTRY },
    countrylb: { type: Leaderboard.COUNTRY },
    clb: { type: Leaderboard.COUNTRY },
    ct: { type: Leaderboard.COUNTRY }

};

async function run({ message, args, commandName }: { message: Message, args: Array<string>, commandName: string }): Promise<void> {
    const channel = await message.fetchChannel();

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

    const embedOptions = {
        builderType: EmbedBuilderType.LEADERBOARD,
        type: modeAliases[commandName].type,
        page: Number(flags.p ?? flags.page) || undefined,
        beatmapId: Number(beatmapId),
        mods
    } satisfies LeaderboardBuilderOptions;

    const embeds = await leaderboardBuilder(embedOptions);

    const sentMessage = await channel.send({
        embeds,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [ { type: ComponentType.Button, style: ButtonStyle.Primary, custom_id: "increment-page", label: "add_page" } ]
            }
        ]
    });

    mesageDataForButtons.set(sentMessage.id, embedOptions);
}

export default {
    name: "leaderboard",
    aliases: Object.keys(modeAliases),
    description: "Display the leaderboard of a beatmap.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
