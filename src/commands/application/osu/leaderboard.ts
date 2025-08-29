import { getCommandArgs } from "@utils/args";
import { getBeatmapIdFromContext, getBeatmapTopScores } from "@utils/osu";
import { leaderboardBuilder } from "@builders";
import { EmbedBuilderType } from "@type/builders";
import { client } from "@utils/initalize";
import { createPaginationActionRow } from "@utils/pagination";
import { ButtonStateCache } from "@utils/cache";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { LeaderboardBuilderOptions } from "@type/builders";
import type { Mod } from "osu-web.js";
import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";
import type { SlashCommand } from "@type/commands";

export default {
    data: {
        name: "leaderboard",
        description: "Display the leaderboard of a beatmap",
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "type",
                description: "The type of the leaderboard.",
                choices: [
                    { name: "Global Leaderboard", value: "global" },
                    { name: "Turkish Leaderboard", value: "country" },
                ],
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "map",
                description: "Specify a beatmap link (eg: https://osu.ppy.sh/b/72727)",
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mods",
                description: "Specify a mods combination.",
                min_length: 2,
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "page",
                description: "Specify a page.",
            },
        ],
    },
    run,
} satisfies SlashCommand;

async function run(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply();

    const { user, mods } = getCommandArgs(interaction);

    const beatmapId = user.beatmapId ?? (await getBeatmapIdFromContext({ channelId: interaction.channelId, client: interaction.client }));
    if (typeof beatmapId === "undefined" || beatmapId === null) {
        await interaction.editReply({
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
        await interaction.editReply({
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
        await interaction.editReply({
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

    const isGlobal = (interaction.data.getString("type") ?? "global") === "global";
    const scores = await getBeatmapTopScores({ beatmapId: Number(beatmapId), mode: beatmap.mode, isGlobal, mods: mods.name ? (mods.name.match(/.{1,2}/g) as Array<Mod>) : undefined });
    if (scores.length === 0) {
        await interaction.editReply({
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

    const page = (interaction.data.getNumber("page") ?? 1) - 1;

    const embedOptions: LeaderboardBuilderOptions = {
        type: EmbedBuilderType.LEADERBOARD,
        initiatorId: interaction.member.user.id,
        page,
        beatmap,
        scores,
    };

    const embeds = await leaderboardBuilder(embedOptions);

    const sentInteraction = await interaction.editReply({
        embeds,
        components: createPaginationActionRow(embedOptions),
    });

    await ButtonStateCache.set(sentInteraction.id, embedOptions);
}
