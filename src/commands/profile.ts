import { getUser } from "../utils/database";
import { ApplicationCommandOptionType } from "lilybird";
import type { ApplicationCommandData, Interaction } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;
    await interaction.deferReply();

    const { data, member } = interaction;

    const username = data.getString("username") ?? getUser(member.user.id);
    const mode = data.getString("mode") ?? "osu";

    const discordUserId = data.getUser("discord");
    const discordUser = getUser(discordUserId ?? "");

    console.log(discordUser, username);

    if (typeof discordUser === "undefined" && typeof username !== "undefined") {
        await interaction.editReply(`The user <@${discordUserId}> hasn't linked their account to the bot yet! mode: ${mode}`);
        return;
    }

    if (typeof username === "undefined") {
        await interaction.editReply(`Please link your account to the bot using /link! mode: ${mode}`);
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
