import { getEntry, insertData } from "@utils/database";
import { DEFAULT_PREFIX, MAX_AMOUNT_OF_PREFIXES } from "@utils/constants";
import { guildPrefixesCache } from "@utils/cache";
import { Tables } from "@type/database";
import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";
import { CommandData, ApplicationCommand } from "@type/commands";
import { ApplicationCommandOptionType, PermissionFlags, EmbedType } from "lilybird";

const commands: Record<string, ({ prefix, interaction, guildId }: { prefix?: string; interaction: GuildInteraction<ApplicationCommandData>; guildId: string }) => Promise<void>> = {
    add,
    remove,
    list,
};

const PermissionNames: Record<number, string> = {};
Object.entries(PermissionFlags).forEach(([name, value]) => {
    PermissionNames[Number(value)] = name;
});

const PERMISSIONS_NEEDED_INT = PermissionFlags.MANAGE_GUILD;
const PERMISSIONS_NEEDED = PermissionNames[Number(PERMISSIONS_NEEDED_INT)];
const PERMISSION_NEEDED_STRING = `Looks like you don't have the necessary permissions for this command. Permission(s) needed: \`${PERMISSIONS_NEEDED}\``;

export async function runApplication({ interaction }: ApplicationCommand) {
    await interaction.deferReply();

    const subcommand = interaction.data.subCommand ?? "list";
    const prefix = interaction.data.getString("prefix");
    await commands[subcommand]({ prefix, interaction, guildId: interaction.guildId });
}

async function checkForPermissions(interaction: GuildInteraction<ApplicationCommandData>): Promise<false | undefined> {
    const { member } = interaction;
    if (!member.permissions) {
        await interaction.editReply(PERMISSION_NEEDED_STRING);
        return false;
    }

    if ((BigInt(member.permissions) & BigInt(PERMISSIONS_NEEDED_INT)) === BigInt(0)) {
        await interaction.editReply(PERMISSION_NEEDED_STRING);
        return false;
    }
}

async function add({ prefix, interaction, guildId }: { prefix?: string; interaction: GuildInteraction<ApplicationCommandData>; guildId: string }): Promise<void> {
    const checkPerms = await checkForPermissions(interaction);
    if (checkPerms === false) return;

    const guild = getEntry(Tables.GUILD, guildId);
    if (typeof prefix === "undefined" || guild === null) return;
    let { prefixes } = guild;

    if (prefixes !== null && !Array.isArray(prefixes)) prefixes = JSON.parse(prefixes) as Array<string>;

    if (prefixes && prefixes.length > MAX_AMOUNT_OF_PREFIXES) {
        await interaction.editReply(`**The maximum amount of prefixes allowed is \`${MAX_AMOUNT_OF_PREFIXES}\`. You can remove a prefix using \`/prefix remove\`**`);
        return;
    }

    if (prefixes?.some((pref) => pref === prefix)) {
        await interaction.editReply(`**The prefix \`${prefix}\` is already in the prefixes list. You can look at current prefixes by using \`/prefix list\`**`);
        return;
    }

    const newPrefixes = prefixes === null ? [prefix] : [...prefixes, prefix];

    insertData({ table: Tables.GUILD, id: guildId, data: [{ key: "prefixes", value: JSON.stringify(newPrefixes) }] });
    guildPrefixesCache.set(guildId, newPrefixes);

    await interaction.editReply(`**The prefix \`${prefix}\` has been added to the list.**`);
    return;
}

async function remove({ prefix, interaction, guildId }: { prefix?: string; interaction: GuildInteraction<ApplicationCommandData>; guildId: string }): Promise<void> {
    const checkPerms = await checkForPermissions(interaction);
    if (checkPerms === false) return;

    const guild = getEntry(Tables.GUILD, guildId);
    if (typeof prefix === "undefined" || guild === null) return;
    const { prefixes } = guild;

    if (prefixes === null) {
        await interaction.editReply("**There aren't any prefixes on this guild. You can add a new prefixes by using `/prefix add`**");
        return;
    }

    if (!prefixes.some((pref) => pref === prefix)) {
        await interaction.editReply(`**The prefix \`${prefix}\` is not in the prefixes list. You can look at current prefixes by using \`/prefix list\`**`);
        return;
    }

    const newPrefixes = prefixes.filter((item) => item !== prefix);
    insertData({ table: Tables.GUILD, id: guildId, data: [{ key: "prefixes", value: newPrefixes.length > 0 ? JSON.stringify(newPrefixes) : null }] });
    guildPrefixesCache.set(guildId, newPrefixes.length > 0 ? newPrefixes : DEFAULT_PREFIX);

    let message = `**The prefix \`${prefix}\` has been removed from the list.**`;
    if (newPrefixes.length === 0) message = `**__Warning__:\nThere are no more custom prefixes on the guild left. The default prefix is \`${DEFAULT_PREFIX.join("")}\`**`;

    await interaction.editReply(message);
    return;
}

async function list({ interaction, guildId }: { interaction: GuildInteraction<ApplicationCommandData>; guildId: string }): Promise<void> {
    const guild = getEntry(Tables.GUILD, guildId);
    if (guild === null) return;

    const { prefixes } = guild;

    if (prefixes === null) {
        await interaction.editReply(`**There aren't any custom prefixes on this guild. The default is \`${DEFAULT_PREFIX.join("")}\`**`);
        return;
    }

    await interaction.editReply({ embeds: [{ type: EmbedType.Rich, title: "Currently defined prefixes", description: `**\`${prefixes.join("`**, `")}\`**` }] });
}

export const data = {
    name: "prefix",
    description: "Configure the prefix of the bot.",
    hasPrefixVariant: false,
    application: {
        options: [
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "add",
                description: "Add a prefix",
                options: [{ name: "prefix", description: "The prefix", type: ApplicationCommandOptionType.STRING, required: true }],
            },
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "remove",
                description: "Remove a prefix",
                options: [{ name: "prefix", description: "The prefix", type: ApplicationCommandOptionType.STRING, required: true }],
            },
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "list",
                description: "Get a list of the current prefixes",
            },
        ],
    },
} satisfies CommandData;
