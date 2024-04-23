import { Tables } from "@type/database";
import { getRowCount } from "@utils/database";
import { commandAliases, messageCommands } from "@utils/initalize";
import type { EmbedStructure } from "lilybird";

export function commandBuilder(command: string | undefined): Array<EmbedStructure> {
    if (typeof command === "undefined")
        return displayAllCommands();

    return displayCommandInfo(command);
}

function displayCommandInfo(name: string): Array<EmbedStructure> {
    const cmd = messageCommands.get(name) ?? messageCommands.get(commandAliases.get(name) ?? "");
    if (typeof cmd === "undefined") {
        return [
            {
                title: "Uh oh.",
                description: `Unfortunately, the command \`${name}\` doesn't exist.`
            }
        ];
    }

    const { default: command } = cmd;

    const cooldownSecond = command.cooldown / 1000;
    return [
        {
            title: `${command.name}`,
            description: command.description,
            fields: [
                {
                    name: "Cooldown",
                    value: `${cooldownSecond} second${cooldownSecond > 1 ? "s" : ""}`
                },
                {
                    name: "Aliases",
                    value: command.aliases?.join(", ") ?? "`no aliases`",
                    inline: true
                },
                {
                    name: "Usage",
                    value: command.usage,
                    inline: false
                },
                {
                    name: "Details",
                    value: command.details ?? "`no details`"
                }
            ]
        }
    ];
}

function displayAllCommands(): Array<EmbedStructure> {
    const usedPrefixCommands = getRowCount(Tables.COMMAND);
    const usedApplicationCommands = getRowCount(Tables.COMMAND_SLASH);

    return [
        {
            title: "Commands",
            description: `**Used prefix commands:** ${usedPrefixCommands}\n**Used application commands:** ${usedApplicationCommands}`,
            fields: [
                {
                    name: "Statistics",
                    value: `**Joined servers:** \`${joinedServers}\`\n**Users linked:** \`${linkedUers}\`\n**Maps in database:** ${downloadedMaps}`
                },
                {
                    name: "Commands",
                    value: `**Used prefix commands:** ${usedPrefixCommands}\n**Used application commands:** ${usedApplicationCommands}`
                },
                {
                    name: "Links",
                    value: `[Official Website](${hanamiWebsite}) | [Invite Link](${inviteLink}) | [top.gg Link](${voteLink})`
                }
            ]
        }
    ];
}
