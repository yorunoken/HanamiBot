import { getUser, insertData } from "../../utils/database";
import { ScoreEmbed } from "../../types/database";
import { ApplicationCommandOptionType } from "lilybird";
import type { ApplicationCommandData, EmbedStructure, GuildInteraction, Interaction } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

const commands: Record<string, (interaction: GuildInteraction<ApplicationCommandData>) => Promise<void>> = {
    score_embeds,
    mode,
    list
};

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply();
    if (!interaction.inGuild()) return;

    const subcommand = interaction.data.subCommand ?? "list";

    await commands[subcommand](interaction);
}

async function list(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    const defaults: Record<string, string> = {
        score_embeds: "Maximized",
        mode: "None",
        unknown: "unknown"
    };

    const userId = interaction.member.user.id;
    let user = getUser(userId);
    if (!user) {
        insertData({ table: "users", id: userId, data: [ { name: "banchoId", value: null } ] });
        user = { banchoId: null, mode: null, score_embeds: null, id: userId };
    }
    const embeds: EmbedStructure = { fields: [] };

    for (const [key, v] of Object.entries(user)) {
        const value = v as string | number | null;
        console.log(key, value);
        if (key === "id" || key === "banchoId") continue;

        if (value !== null)
            embeds.fields?.push({ name: key, value: typeof value === "number" ? ScoreEmbed[value] : value });
        else
            embeds.fields?.push({ name: key, value: defaults[key || "unknown"] });
    }

    console.log(embeds);
    await interaction.editReply({ embeds: [embeds] });
}

async function mode(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    const choice = interaction.data.getString("mode", true);
    insertData({ table: "users", id: interaction.member.user.id, data: [ { name: "mode", value: choice } ] });
    await interaction.editReply(`Successfully set \`mode\` to: \`${choice}\``);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function score_embeds(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    const choice = interaction.data.getNumber("score_embeds", true);
    insertData({ table: "users", id: interaction.member.user.id, data: [ { name: "score_embeds", value: choice } ] });
    await interaction.editReply(`Successfully set \`score_embeds\` to: \`${ScoreEmbed[choice]}\``);
}

export default {
    post: "GLOBAL",
    data: {
        name: "config",
        description: "Set your account configurations",
        options: [
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "score_embeds",
                description: "Specify what size score embeds should be. (compare, recent...)",
                options: [
                    {
                        type: ApplicationCommandOptionType.NUMBER,
                        name: "score_embeds",
                        description: "Specify what size score embeds should be. (compare, recent...)",
                        choices: [ { name: "Maximized", value: 1 }, { name: "Minimized", value: 0 } ],
                        required: true
                    }

                ],
                required: false
            },
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "mode",
                description: "Specify an osu! mode",
                options: [
                    {
                        type: ApplicationCommandOptionType.STRING,
                        name: "mode",
                        description: "Specify an osu! mode (none defaults to osu)",
                        choices: [ { name: "None", value: "osu" }, { name: "osu", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "ctb", value: "fruits" } ],
                        required: true

                    }
                ],
                required: false

            },
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "list",
                description: "Get a list of your configs.",
                required: false
            }
        ]
    },
    run
} satisfies SlashCommand;
