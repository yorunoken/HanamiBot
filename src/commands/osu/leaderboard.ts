import { getCommandArgs } from "../../utils/args";
import { getBeatmapIdFromContext, getBeatmapTopScores } from "../../utils/osu";
import { leaderboardBuilder } from "../../embed-builders/leaderboard";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { client } from "../../utils/initalize";
import { createActionRow, calculateButtonState } from "../../utils/buttons";
import { mesageDataForButtons } from "../../utils/cache";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { LeaderboardBuilderOptions } from "../../types/embedBuilders";
import type { Mod } from "osu-web.js";
import type { ApplicationCommandData, Interaction } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

export default {
    post: "GLOBAL",
    data: {
        name: "leaderboard",
        description: "Display the leaderboard of a beatmap",
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "type",
                description: "The type of the leaderboard.",
                choices: [ { name: "Global Leaderboard", value: "country" }, { name: "Turkish Leaderboard", value: "global" } ]
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "map",
                description: "Specify a beatmap link (eg: https://osu.ppy.sh/b/72727)"
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mods",
                description: "Specify a mods combination.",
                min_length: 2
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "page",
                description: "Specify a page."
            }
        ]
    },
    run
} satisfies SlashCommand;

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;
    await interaction.deferReply();

    const args = getCommandArgs(interaction);

    if (typeof args === "undefined") return;
    const { user, mods } = args;

    const beatmapId = user.beatmapId ?? await getBeatmapIdFromContext({ channelId: interaction.channelId, client: interaction.client });
    if (typeof beatmapId === "undefined" || beatmapId === null) {
        await interaction.editReply({
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
        await interaction.editReply({
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

    if (beatmap.status === "pending" || beatmap.status === "wip" || beatmap.status === "graveyard") {
        await interaction.editReply({
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

    const isGlobal = interaction.data.getString("type") === "global";
    const { scores } = await getBeatmapTopScores({ beatmapId: Number(beatmapId), mode: beatmap.mode, isGlobal, mods: mods.name ? <Array<Mod>>mods.name.match(/.{1,2}/g) : undefined });
    if (scores.length === 0) {
        await interaction.editReply({
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

    const page = (interaction.data.getNumber("page") ?? 1) - 1;
    const totalPages = Math.ceil(scores.length / 5);

    const embedOptions: LeaderboardBuilderOptions = {
        type: EmbedBuilderType.LEADERBOARD,
        initiatorId: interaction.member.user.id,
        page,
        beatmap,
        scores
    };

    const embeds = await leaderboardBuilder(embedOptions);

    const sentInteraction = await interaction.editReply({
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

    // ??
    mesageDataForButtons.set(sentInteraction.id, embedOptions);
}
