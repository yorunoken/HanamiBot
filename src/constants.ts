import type { ExtendedClient } from "./Structure/index";

export const defaultPrefix = "!";
export function serverJoinMessage(client: ExtendedClient): string {
    return `Hello, I'm ${client.user?.username}! I'm a Discord bot developed by @yorunoken for osu!game. I can fetch recent plays and display top scores!
Here are my commands:
\`\`\`none\`\`\`
If you come across any issues or bugs, contact my owner at @yorunoken on Discord or @ken_yoru on Twiter.`;
}

