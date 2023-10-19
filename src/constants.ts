import { MyClient } from ".";

export const defaultPrefix = "!";
export const serverJoinMessage = (client: MyClient) =>
  `Hello, I'm ${client.user?.username}! I'm a Discord bot developed by @yorunoken for osu!game. I can fetch recent plays and display top scores!\nHere are my commands:\n\`\`\`none\`\`\`\n If you come across any issues or bugs, contact my owner at @yorunoken on Discord or @ken_yoru on Twiter.`;
