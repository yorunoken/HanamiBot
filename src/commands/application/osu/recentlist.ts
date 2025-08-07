import { getCommandArgs } from "@utils/args";
import { playBuilder } from "@builders/plays";
import { getUserScores } from "@utils/score-api";
import { client } from "@utils/initalize";
import { UserType } from "@type/commandArgs";
import { EmbedBuilderType } from "@type/embedBuilders";
import { PlayType } from "@type/osu";
import { createPaginationActionRow } from "@utils/pagination";
import { ButtonStateCache } from "@utils/cache";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { PlaysBuilderOptions } from "@type/embedBuilders";
import type { Mod } from "osu-web.js";
import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";
import type { SlashCommand } from "@type/commands";

export default {
    data: {
        name: "recentlist",
        description: "Display a list of recent play(s) of a user.",
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "username",
                description: "Specify an osu! username",
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
                type: ApplicationCommandOptionType.INTEGER,
                name: "index",
                description: "Specify an index, defaults to 1.",
                min_value: 1,
                max_value: 100,
            },
            {
                type: ApplicationCommandOptionType.INTEGER,
                name: "page",
                description: "Specify a page, defaults to 1.",
                min_value: 1,
                max_value: 20,
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
                type: ApplicationCommandOptionType.BOOLEAN,
                name: "passes",
                description: "Whether or not only passes should be considered.",
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

    const { user } = getCommandArgs(interaction);

    const includeFails = !(interaction.data.getBoolean("passes") ?? false);
    let index = interaction.data.getInteger("index");
    let page = interaction.data.getInteger("page");

    if (typeof page === "undefined" && typeof index === "undefined") page = 1;

    if (page) page -= 1;

    if (index) index -= 1;

    const mod = interaction.data.getString("mods") as Mod;
    const modsAction = interaction.data.getString("mods_action");

    const mods = { exclude: false, forceInclude: false, include: false, name: mod };
    switch (modsAction) {
        case "include":
            mods.include = true;
            break;
        case "force_include":
            mods.forceInclude = true;
            break;
        case "exclude":
            mods.exclude = true;
            break;
        default:
            mods.include = true;
    }

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

    const plays = await getUserScores(osuUser.id, PlayType.RECENT, { query: { mode: user.mode, limit: 100, include_fails: includeFails } }, user.authorDb);

    if (plays.length === 0) {
        await interaction.editReply({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like \`${osuUser.username}\` hasn't had any recent plays in the last 24 hours!`,
                },
            ],
        });
        return;
    }

    const isPage = typeof page !== "undefined";

    const embedOptions: PlaysBuilderOptions = {
        type: EmbedBuilderType.PLAYS,
        initiatorId: interaction.member.user.id,
        user: osuUser,
        mode: user.mode,
        isMultiple: true,
        mods: { exclude: false, forceInclude: false, include: true, name: mod },
        authorDb: user.authorDb,
        page,
        index,
        isPage,
        plays,
    };

    const embeds = await playBuilder(embedOptions);

    const sentInteraction = await interaction.editReply({
        embeds,
        components: createPaginationActionRow(embedOptions),
    });

    await ButtonStateCache.set(sentInteraction.id, embedOptions);
}
