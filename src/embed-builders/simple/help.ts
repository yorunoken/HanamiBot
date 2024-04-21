import { getRowCount } from "@utils/database";
import type { EmbedStructure } from "lilybird";

export function helpBuilder(): Array<EmbedStructure> {
    const joinedServers = getRowCount("servers");
    const linkedUers = getRowCount("users");
    const downloadedMaps = getRowCount("maps");
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
                { name: "Links", value: `[Official Website](${hanamiWebsite}) | [Invite Link](${inviteLink}) | [Vote Link](${voteLink})` }
            ]
        }
    ];
}
