import { getCommandArgs } from "../../utils/args";
import { playBuilder } from "../../embed-builders/plays";
import { client } from "../../utils/initalize";
import { UserType } from "../../types/commandArgs";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { PlayType } from "../../types/osu";
import { createActionRow, calculateButtonState } from "../../utils/buttons";
import { mesageDataForButtons } from "../../utils/cache";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { PlaysBuilderOptions } from "../../types/embedBuilders";
import type { Mod } from "osu-web.js";
import type { ApplicationCommandData, Interaction } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

export default {
    post: "GLOBAL",
    data: {
        name: "recentlist",
        description: "Display a list of recent play(s) of a user.",
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "username",
                description: "Specify an osu! username"
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mode",
                description: "Specify an osu! mode",
                choices: [ { name: "osu", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "ctb", value: "fruits" } ]
            },
            {
                type: ApplicationCommandOptionType.INTEGER,
                name: "index",
                description: "Specify an index, defaults to 1.",
                min_value: 1,
                max_value: 100
            },
            {
                type: ApplicationCommandOptionType.INTEGER,
                name: "page",
                description: "Specify a page, defaults to 1.",
                min_value: 1,
                max_value: 20
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mods",
                description: "Specify a mods combination.",
                min_length: 2
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mods_action",
                description: "Specify the action to perform on the mods combination.",
                choices: [
                    {
                        name: "Include",
                        value: "include"
                    },
                    {
                        name: "Force Include",
                        value: "force_include"
                    },
                    {
                        name: "Exclude",
                        value: "exclude"
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "grade",
                description: "Consider scores only with this grade.",
                choices: ["SS", "S", "A", "B", "C", "D"].map((grade) => ({ name: grade, value: grade }))
            },
            {
                type: ApplicationCommandOptionType.BOOLEAN,
                name: "passes",
                description: "Whether or not only passes should be considered."
            },
            {
                type: ApplicationCommandOptionType.USER,
                name: "discord",
                description: "Specify a linked Discord user"
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

    const includeFails = !(interaction.data.getBoolean("passes") ?? false);
    let index = interaction.data.getInteger("index");
    let page = interaction.data.getInteger("page");

    if (typeof page === "undefined" && typeof index === "undefined")
        page = 1;

    if (page)
        page -= 1;

    if (index)
        index -= 1;

    const mod = interaction.data.getString("mods") as Mod;
    const modsAction = interaction.data.getString("mods_action");

    const mods = { exclude: false, forceInclude: false, include: false, name: mod };
    switch (modsAction) {
        case "include":
            mods.include = true; break;
        case "force_include":
            mods.forceInclude = true; break;
        case "exclude":
            mods.exclude = true; break;
        default:
            mods.include = true;
    }

    if (user.type === UserType.FAIL) {
        await interaction.editReply(user.failMessage);
        return;
    }

    const osuUser = await client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } });
    if (!osuUser.id) {
        await interaction.editReply("This user does not exist.");
        return;
    }

    const plays = (await client.users.getUserScores(osuUser.id, PlayType.RECENT, { query: { mode: user.mode, limit: 100, include_fails: includeFails } })).map((item, idx) => {
        return { ...item, position: idx + 1 };
    });

    if (plays.length === 0) {
        await interaction.editReply({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like \`${osuUser.username}\` hasn't had any recent plays in the last 24 hours!`
                }
            ]
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
        page,
        index,
        isPage,
        plays
    };

    const embeds = await playBuilder(embedOptions);

    const totalPages = Math.ceil(plays.length / 5);

    const sentInteraction = await interaction.editReply({
        embeds,
        components: createActionRow({
            isPage,
            disabledStates: [
                isPage ? page === 0 : index === 0,
                calculateButtonState(false, index ?? 0, totalPages),
                calculateButtonState(true, index ?? 0, totalPages),
                isPage ? page === totalPages - 1 : index === totalPages - 1
            ]
        })
    });

    mesageDataForButtons.set(sentInteraction.id, embedOptions);
}
