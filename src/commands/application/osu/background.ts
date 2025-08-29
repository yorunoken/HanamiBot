import { getCommandArgs } from "@utils/args";
import { getBeatmapIdFromContext } from "@utils/osu";
import { EmbedBuilderType } from "@type/builders";
import { backgroundBuilder } from "@builders/index";
import { client } from "@utils/initalize";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";
import type { SlashCommand } from "@type/commands";

export default {
    data: {
        name: "background",
        description: "Display background of a beatmap.",
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "map",
                description: "Specify a beatmap link (eg: https://osu.ppy.sh/b/72727)",
            },
        ],
    },
    run,
} satisfies SlashCommand;

async function run(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply();

    const { user } = getCommandArgs(interaction);

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

    const embeds = backgroundBuilder({
        type: EmbedBuilderType.BACKGROUND,
        initiatorId: interaction.member.user.id,
        beatmap: beatmap,
    });
    await interaction.editReply({ embeds });
}
