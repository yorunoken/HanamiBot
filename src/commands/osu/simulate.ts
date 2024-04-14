import { getCommandArgs } from "@utils/args";
import { getBeatmapIdFromContext } from "@utils/osu";
import { simulateBuilder } from "@builders/simulate";
import { EmbedBuilderType } from "@type/embedBuilders";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { Mod } from "osu-web.js";
import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";
import type { SlashCommand } from "@lilybird/handlers";

export default {
    post: "GLOBAL",
    data: {
        name: "simulate",
        description: "Simulate a score on a beatmap..",
        options: [
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
                type: ApplicationCommandOptionType.STRING,
                name: "mode",
                description: "Specify a gamemode."
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "combo",
                description: "Specify a combo.",
                min_value: 0
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "acc",
                description: "Specify an accuracy.",
                min_value: 0
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "clock_rate",
                description: "Specify a custom clockrate that overwrites any other rate changes."
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "bpm",
                description: "Specify a BPM instead of a clock rate.",
                min_value: 0,
                max_value: 999
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "n300",
                description: "Specify the amount of 300s.",
                min_value: 0
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "n100",
                description: "Specify the amount of 100s.",
                min_value: 0
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "n50s",
                description: "Specify the amount of 50s.",
                min_value: 0
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "nmisses",
                description: "Specify the amount of misses.",
                min_value: 0
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "ngeki",
                description: "Specify the amount of gekis, aka n320.",
                min_value: 0
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "nkatu",
                description: "Specify the amount of katus, aka n200.",
                min_value: 0
            },
            {
                type: ApplicationCommandOptionType.INTEGER,
                name: "ar",
                description: "Overwrite the map's approach rate.",
                min_value: 0,
                max_value: 11
            },
            {
                type: ApplicationCommandOptionType.INTEGER,
                name: "od",
                description: "Overwrite the map's overall difficulty.",
                min_value: 0,
                max_value: 11.11
            },
            {
                type: ApplicationCommandOptionType.INTEGER,
                name: "cs",
                description: "Overwrite the map's circle size.",
                min_value: 0,
                max_value: 10
            }
        ]
    },
    run
} satisfies SlashCommand;

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;
    await interaction.deferReply();

    const args = getCommandArgs<true>(interaction);

    if (typeof args === "undefined") return;
    const { user, mods, difficultySettings } = args;

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

    const embeds = await simulateBuilder({
        type: EmbedBuilderType.MAP,
        initiatorId: interaction.member.user.id,
        difficultySettings,
        beatmapId: Number(beatmapId),
        mods: <Array<Mod> | null>mods.name?.match(/.{1,2}/g) ?? null
    });
    await interaction.editReply({ embeds });
}
