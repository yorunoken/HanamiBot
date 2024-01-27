import { getServer, insertData } from "../utils/database";
import { DEFAULT_PREFIX, MAX_AMOUNT_OF_PREFIXES } from "../utils/constants";
import { updatePrefixCache } from "../listeners/guildCreate";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { ApplicationCommandData, GuildInteraction, Interaction } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

const commands: Record<string, ({ prefix, interaction, guildId }: { prefix?: string, interaction: GuildInteraction<ApplicationCommandData>, guildId: string }) => Promise<void>> = {
    add,
    remove,
    list
};

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply();
    if (!interaction.inGuild()) return;

    const subcommand = interaction.data.subCommand ?? "list";

    const prefix = interaction.data.getString("prefix");

    await commands[subcommand]({ prefix, interaction, guildId: interaction.guildId });
}

async function add({ prefix, interaction, guildId }: { prefix?: string, interaction: GuildInteraction<ApplicationCommandData>, guildId: string }): Promise<void> {
    const server = getServer(guildId);
    if (!prefix || !server) return;
    let { prefixes } = server;

    if (prefixes !== null && !Array.isArray(prefixes))
        prefixes = JSON.parse(prefixes) as Array<string>;

    if (prefixes && prefixes.length > MAX_AMOUNT_OF_PREFIXES) {
        await interaction.editReply(`**The maximum amount of prefixes allowed is \`${MAX_AMOUNT_OF_PREFIXES}\`. You can remove a prefix using \`/prefix remove\`**`);
        return;
    }

    if (prefixes?.some((pref) => pref === prefix)) {
        await interaction.editReply(`**The prefix \`${prefix}\` is already in the prefixes list. You can look at current prefixes by using \`/prefix list\`**`);
        return;
    }

    const newPrefixes = prefixes === null ? [prefix] : [...prefixes, prefix];

    insertData({ table: "servers", id: guildId, data: [ { name: "prefixes", value: JSON.stringify(newPrefixes) } ] });
    updatePrefixCache(guildId, newPrefixes);

    await interaction.editReply(`**The prefix \`${prefix}\` has been added to the list.**`);
    return;
}

async function remove({ prefix, interaction, guildId }: { prefix?: string, interaction: GuildInteraction<ApplicationCommandData>, guildId: string }): Promise<void> {
    const server = getServer(guildId);
    if (!prefix || !server) return;
    let { prefixes } = server;

    if (prefixes === null) {
        await interaction.editReply("**There aren't any prefixes on this server. You can add a new prefixes by using `/prefix add`**");
        return;
    }
    prefixes = JSON.parse(prefixes.toString()) as Array<string>;

    if (!prefixes.some((pref) => pref === prefix)) {
        await interaction.editReply(`**The prefix \`${prefix}\` is not in the prefixes list. You can look at current prefixes by using \`/prefix list\`**`);
        return;
    }

    const newPrefixes = prefixes.filter((item) => item !== prefix);
    insertData({ table: "servers", id: guildId, data: [ { name: "prefixes", value: JSON.stringify(newPrefixes) } ] });
    updatePrefixCache(guildId, newPrefixes);

    let message = `**The prefix \`${prefix}\` has been removed from the list.**`;
    if (newPrefixes.length === 0)
        message = `**__Warning__:\nThere are no more custom prefixes on the server left. The default prefix is \`${DEFAULT_PREFIX.join("")}\`**`;

    await interaction.editReply(message);
    return;
}

async function list({ interaction, guildId }: { interaction: GuildInteraction<ApplicationCommandData>, guildId: string }): Promise<void> {
    const server = getServer(guildId);
    if (!server) return;

    let { prefixes } = server;

    if (prefixes === null) {
        await interaction.editReply(`**There aren't any custom prefixes on this server. The default is \`${DEFAULT_PREFIX.join("")}\`**`);
        return;
    }
    prefixes = JSON.parse(prefixes.toString()) as Array<string>;

    await interaction.editReply({ embeds: [ { type: EmbedType.Rich, title: "Success!", description: `Below are the current prefixes of this server. \n- \`${prefixes.join("`\n- `")}\`` } ] });
}

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
