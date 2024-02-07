import { getCommandArgs } from "../../utils/args";
import { playBuilder } from "../../embed-builders/plays";
import { client } from "../../utils/initalize";
import { UserType } from "../../types/commandArgs";
import { ApplicationCommandOptionType } from "lilybird";
import type { Mod } from "osu-web.js";
import type { ApplicationCommandData, Interaction } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;
    await interaction.deferReply();

    const args = getCommandArgs(interaction);
    if (typeof args === "undefined") return;
    const { user } = args;

    const includeFails = !(interaction.data.getBoolean("passes") ?? false);
    const index = interaction.data.getInteger("index") ?? 0;
    const mod = interaction.data.getString("mods") as Mod;

    if (user.type === UserType.FAIL) {
        await interaction.editReply(user.failMessage);
        return;
    }

    const osuUser = await client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } });
    if (!osuUser.id) {
        await interaction.editReply("This user does not exist.");
        return;
    }

    const embeds = await playBuilder({
        user: osuUser,
        mode: user.mode,
        type: "recent",
        includeFails,
        initiatorId: interaction.member.user.id,
        index,
        mods: { exclude: false, forceInclude: false, include: true, name: mod }
    });
    await interaction.editReply({ embeds });
}

export default {
    post: "GLOBAL",
    data: {
        name: "recent",
        description: "Display recent play(s) of a user.",
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
                type: ApplicationCommandOptionType.STRING,
                name: "mods",
                description: "Specify a mods combination.",
                min_length: 2
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
