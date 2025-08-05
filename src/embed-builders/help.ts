import { Tables } from "@type/database";
import { getRowCount, getRowSum } from "@utils/database";
import { applicationCommands, messageCommands, commandAliases } from "@utils/initalize";
import type { Embed } from "lilybird";

export function helpBuilder(commandName?: string, preferSlash?: boolean): Array<Embed.Structure> {
    if (commandName) {
        return displayCommandInfo(commandName, preferSlash);
    }

    return displayAllCommands();
}

function displayCommandInfo(name: string, preferSlash?: boolean): Array<Embed.Structure> {
    const slashCmd = applicationCommands.get(name);
    if (slashCmd && preferSlash) {
        const { default: command } = slashCmd;
        return [
            {
                title: `/${command.data.name}`,
                description: command.data.description,
                fields: [
                    {
                        name: "Type",
                        value: "Slash Command",
                        inline: true,
                    },
                    {
                        name: "Options",
                        value: command.data.options?.map((opt) => `\`${opt.name}\` - ${opt.description} ${opt.required ? "(required)" : ""}`).join("\n") ?? "No options",
                        inline: false,
                    },
                ],
            },
        ];
    }

    const msgCmd = messageCommands.get(name) ?? messageCommands.get(commandAliases.get(name) ?? "");
    if (msgCmd && !preferSlash) {
        const { default: command } = msgCmd;
        const cooldownSecond = command.cooldown / 1000;
        return [
            {
                title: `${command.name}`,
                description: command.description,
                fields: [
                    {
                        name: "Type",
                        value: "Message Command",
                        inline: true,
                    },
                    {
                        name: "Cooldown",
                        value: `${cooldownSecond} second${cooldownSecond > 1 ? "s" : ""}`,
                        inline: true,
                    },
                    {
                        name: "Aliases",
                        value: command.aliases?.join(", ") ?? "No aliases",
                        inline: true,
                    },
                    {
                        name: "Usage",
                        value: command.usage,
                        inline: false,
                    },
                    {
                        name: "Details",
                        value: command.details ?? "No additional details",
                    },
                ],
            },
        ];
    }

    return [
        {
            title: "Command Not Found",
            description: `Unfortunately, the command \`${name}\` doesn't exist.`,
            color: 0xff0000,
        },
    ];
}

function displayAllCommands(): Array<Embed.Structure> {
    const joinedServers = getRowCount(Tables.GUILD);
    const linkedUsers = getRowCount(Tables.USER);
    const downloadedMaps = getRowCount(Tables.MAP);
    const usedPrefixCommands = getRowSum(Tables.COMMAND);
    const usedApplicationCommands = getRowSum(Tables.COMMAND_SLASH);

    // Get all command categories
    const slashCommands = Array.from(applicationCommands.keys()).sort();
    const prefixCommands = Array.from(messageCommands.keys()).sort();

    // Group commands by category
    const slashCategories: Record<string, Array<string>> = {};
    const prefixCategories: Record<string, Array<string>> = {};

    for (const cmdName of slashCommands) {
        const cmd = applicationCommands.get(cmdName);
        if (!cmd) continue;

        let category = "General";
        if (
            cmdName.includes("osu") ||
            ["profile", "recent", "top", "compare", "map", "link", "unlink", "avatar", "banner", "background", "card", "simulate", "leaderboard", "recentbest", "recentlist"].includes(cmdName)
        ) {
            category = "osu!";
        } else if (["help", "ping", "invite", "vote", "config", "prefix"].includes(cmdName)) {
            category = "General";
        } else if (cmdName === "owner") {
            category = "Owner";
        }

        if (!slashCategories[category]) slashCategories[category] = [];
        slashCategories[category].push(cmdName);
    }

    for (const cmdName of prefixCommands) {
        const cmd = messageCommands.get(cmdName);
        if (!cmd) continue;

        let category = "General";
        if (
            cmdName.includes("osu") ||
            ["profile", "recent", "top", "compare", "map", "link", "unlink", "avatar", "banner", "background", "card", "simulate", "leaderboard", "recentbest", "recentlist"].includes(cmdName)
        ) {
            category = "osu!";
        } else if (["help", "ping", "invite", "vote", "config", "prefix"].includes(cmdName)) {
            category = "General";
        } else if (cmdName === "owner") {
            category = "Owner";
        }

        if (!prefixCategories[category]) prefixCategories[category] = [];
        prefixCategories[category].push(cmdName);
    }

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    fields.push({
        name: "Slash Commands",
        value: "Use `/help <command>` to get detailed information about a specific command.",
        inline: false,
    });

    for (const [category, commands] of Object.entries(slashCategories)) {
        fields.push({
            name: `/${category}`,
            value: commands.map((cmd) => `\`/${cmd}\``).join(", "),
            inline: true,
        });
    }

    fields.push({
        name: "Message Commands",
        value: "Use `help <command>` to get detailed information about a specific command.",
        inline: false,
    });

    for (const [category, commands] of Object.entries(prefixCategories)) {
        fields.push({
            name: `${category}`,
            value: commands.map((cmd) => `\`${cmd}\``).join(", "),
            inline: true,
        });
    }

    fields.push({
        name: "Bot Statistics",
        value: `**Servers:** \`${joinedServers}\`\n**Linked Users:** \`${linkedUsers}\`\n**Maps in Database:** \`${downloadedMaps}\`\n**Commands Used:** \`${usedPrefixCommands + usedApplicationCommands}\``,
        inline: false,
    });

    const hanamiWebsite = "https://hanami.yorunoken.com";
    const inviteLink = "https://discord.com/oauth2/authorize?client_id=995999045157916763&permissions=346176&scope=bot";
    const voteLink = "https://top.gg/bot/995999045157916763";

    fields.push({
        name: "Links",
        value: `[Website](${hanamiWebsite}) • [Invite](${inviteLink}) • [Vote](${voteLink})`,
        inline: false,
    });

    return [
        {
            title: "Hanami Bot - Help",
            description: "Hanami is a Discord bot for osu!",
            fields,
            color: 0xffc0cb,
        },
    ];
}
