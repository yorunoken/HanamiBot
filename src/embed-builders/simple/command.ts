import { Tables } from "@type/database";
import { getRowCount } from "@utils/database";
import type { EmbedStructure } from "lilybird";

export function commandBuilder(command?: string): Array<EmbedStructure> {
    if (typeof command === "undefined")
        return displayAllCommands();

    return displayCommandInfo();
}

function displayCommandInfo(): Array<EmbedStructure> {
    
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
