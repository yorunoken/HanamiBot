import { Tables } from "@type/database";
import { getRowSum } from "@utils/database";
import { commandAliases, messageCommands } from "@utils/initalize";
import type { Embed } from "lilybird";

export function commandBuilder(command: string | undefined): Array<Embed.Structure> {
    if (typeof command === "undefined")
        return displayAllCommands();

    return displayCommandInfo(command);
}

function displayCommandInfo(name: string): Array<Embed.Structure> {
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

function displayAllCommands(): Array<Embed.Structure> {
    const usedPrefixCommands = getRowSum(Tables.COMMAND);
    const usedApplicationCommands = getRowSum(Tables.COMMAND_SLASH);

    return [
        {
            title: "Commands",
            description: `**Used prefix commands:** ${usedPrefixCommands}\n**Used application commands:** ${usedApplicationCommands}`
        }
    ];
}
