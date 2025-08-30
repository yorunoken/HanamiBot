import { getCommandArgs } from "@utils/args";
import { getBeatmapUserScores } from "@utils/score-api";
import { client } from "@utils/initalize";
import { UserType } from "@type/command-args";
import { compareBuilder } from "@builders";
import { getBeatmapIdFromContext } from "@utils/osu";
import { EmbedBuilderType } from "@type/builders";
import { createPaginationActionRow } from "@utils/pagination";
import { ButtonStateCache } from "@utils/cache";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";
import type { SlashCommand } from "@type/commands";

export default {
    data: {
        name: "compare",
        description: "Display play(s) of a user on a beatmap.",
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "username",
                description: "Specify an osu! username",
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "map",
                description: "Specify a beatmap link (eg: https://osu.ppy.sh/b/72727)",
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mode",
                description: "Specify an osu! mode",
                choices: [
                    { name: "osu", value: "osu" },
                    { name: "mania", value: "mania" },
                    { name: "taiko", value: "taiko" },
                    { name: "ctb", value: "fruits" },
                ],
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mods",
                description: "Specify a mods combination.",
                min_length: 2,
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mods_action",
                description: "Specify the action to perform on the mods combination.",
                choices: [
                    {
                        name: "Include",
                        value: "include",
                    },
                    {
                        name: "Force Include",
                        value: "force_include",
                    },
                    {
                        name: "Exclude",
                        value: "exclude",
                    },
                ],
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "grade",
                description: "Consider scores only with this grade.",
                choices: ["SS", "S", "A", "B", "C", "D"].map((grade) => ({ name: grade, value: grade })),
            },
            {
                type: ApplicationCommandOptionType.USER,
                name: "discord",
                description: "Specify a linked Discord user",
            },
        ],
    },
    run,
} satisfies SlashCommand;

async function run(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply();

    const { user, mods } = getCommandArgs(interaction);

    if (user.type === UserType.FAIL) {
        await interaction.editReply(user.failMessage);
        return;
    }

    const osuUserRequest = await client.safeParse(client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } }));
    if (!osuUserRequest.success) {
        await interaction.editReply({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like the user **\`${user.banchoId}\`** doesn't exist! :(`,
                },
            ],
        });
        return;
    }
    const osuUser = osuUserRequest.data;

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

    const plays = (await getBeatmapUserScores(beatmap.id, osuUser.id, { query: { mode: user.mode } }, user.authorDb)).sort((a: any, b: any) => b.pp - a.pp);

    if (plays.length === 0) {
        await interaction.editReply({
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
        initiatorId: interaction.member.user.id,
        mode: user.mode,
        user: osuUser,
        beatmap,
        plays,
        mods,
        page: 0,
    };

    const embeds = await compareBuilder(embedOptions);
    const sentInteraction = await interaction.editReply({
        embeds,
        components: createPaginationActionRow(embedOptions),
    });
    await ButtonStateCache.set(sentInteraction.id, embedOptions);
}
