import { Tables } from "@type/database";
import { getRowCount, getRowSum } from "@utils/database";
import type { Embed } from "lilybird";

export function helpBuilder(): Array<Embed.Structure> {
    const joinedServers = getRowCount(Tables.GUILD);
    const linkedUers = getRowCount(Tables.USER);
    const downloadedMaps = getRowCount(Tables.MAP);

    const usedPrefixCommands = getRowSum(Tables.COMMAND);
    const usedApplicationCommands = getRowSum(Tables.COMMAND_SLASH);

    const hanamiWebsite = "https://hanami.yorunoken.com";
    const inviteLink = "https://discord.com/oauth2/authorize?client_id=995999045157916763&permissions=265216&scope=bot";
    const voteLink = "https://top.gg/bot/995999045157916763";

    return [
        {
            title: "Info",
            description: "Hanami is a Discord bot written in TypeScript that aims to provide you with information and calculations of osu! plays.",
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
