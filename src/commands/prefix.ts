import { getServer, insertData } from "../utils/database";
import { updatePrefixCache } from "../cache";
import { ApplicationCommandOptionType } from "lilybird";
import type { ApplicationCommandData, GuildInteraction, Interaction } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

const commands: Record<string, ({ prefix, interaction, guildId }: { prefix?: string, interaction: GuildInteraction<ApplicationCommandData>, guildId: string }) => Promise<void>> = {
    add,
    remove,
    list
};

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    console.log("la");
    await interaction.editReply("test 1");

    if (!interaction.inGuild()) return;
    console.log("ww");
    await interaction.editReply("test 2");

    const subcommand = interaction.data.subCommand ?? "list";

    const prefix = interaction.data.getString("prefix");

    await commands[subcommand]({ prefix, interaction, guildId: interaction.guildId });
}

async function add({ prefix, interaction, guildId }: { prefix?: string, interaction: GuildInteraction<ApplicationCommandData>, guildId: string }): Promise<void> {
    const server = getServer(guildId);
    if (!server || !prefix) return;
    let { prefixes } = server;

    if (prefixes !== null)
        prefixes = JSON.parse(prefixes.toString()) as Array<string>;

    if (prefixes && prefixes.some((pref) => pref === prefix)) {
        await interaction.editReply(`The prefix, ${prefix}, is already in the prefixes list.`);
        return;
    }

    const newPrefixes = prefixes === null ? [prefix] : [...prefixes, prefix];

    insertData({ table: "servers", id: guildId, data: [ { name: "prefixes", value: JSON.stringify(newPrefixes) } ] });
    updatePrefixCache(guildId, newPrefixes);

    await interaction.editReply(`The prefix, ${prefix}, has been added to the list.`);
    return;
}

async function remove({ prefix, interaction, guildId }: { prefix?: string, interaction: GuildInteraction<ApplicationCommandData>, guildId: string }): Promise<void> {
    // implement function
}

async function list({ interaction, guildId }: { interaction: GuildInteraction<ApplicationCommandData>, guildId: string }): Promise<void> {
    // implement function
}

// This is RIP until Didas fixes subcommands
export default {
    post: "GLOBAL",
    data: {
        name: "prefix",
        description: "Set, remove and list the bot's prefixes",
        options: [
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "add",
                description: "Add a prefix",
                options: [ { name: "prefix", description: "The prefix", type: ApplicationCommandOptionType.STRING, required: true } ]
            },
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "remove",
                description: "Remove a prefix",
                options: [ { name: "prefix", description: "The prefix", type: ApplicationCommandOptionType.STRING, required: true } ]
            },
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "list",
                description: "Get a list of the current prefixes"
            }
        ]
    },
    run
} satisfies SlashCommand;
