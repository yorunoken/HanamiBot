import { getCommandArgs } from "../../utils/args";
import { getBeatmapIdFromContext } from "../../utils/osu";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { backgroundBuilder } from "../../embed-builders/backgroundBuilder";
import { client } from "../../utils/initalize";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { ApplicationCommandData, Interaction } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

export default {
    post: "GLOBAL",
    data: {
        name: "background",
        description: "Display background of a beatmap.",
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "map",
                description: "Specify a beatmap link (eg: https://osu.ppy.sh/b/72727)"
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
    const { user } = args;

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

    const beatmap = await client.beatmaps.getBeatmap(Number(beatmapId));
    if (!beatmap.id) {
        await interaction.editReply({
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

    const embeds = backgroundBuilder({
        type: EmbedBuilderType.MAP,
        initiatorId: interaction.member.user.id,
        beatmap
    });
    await interaction.editReply({ embeds });
}

