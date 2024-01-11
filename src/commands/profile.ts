import { getCommandArgs } from "../utils/args";
import { ApplicationCommandOptionType } from "lilybird";
import type { ApplicationCommandData, Interaction } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;
    await interaction.deferReply();

    const commandArgs = getCommandArgs(interaction);
    if (commandArgs?.user.type === "fail") {
        await interaction.editReply(commandArgs.user.failMessage);
        return;
    }
}

export default {
    post: "GLOBAL",
    data: {
        name: "profile",
        description: "Display statistics of a user.",
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
                type: ApplicationCommandOptionType.USER,
                name: "discord",
                description: "Specify a linked Discord user"
            }
        ]
    },
    run
} satisfies SlashCommand;
