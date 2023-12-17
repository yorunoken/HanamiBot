import { PermissionFlagsBits } from "discord.js";
import type { Message, TextChannel } from "discord.js";
import type { ExtendedClient } from "../../Structure/index";

export const name = "shout";
export const aliases = ["shout"];
export const cooldown = 0;
export const description = "Shouts at all the servers";

export function run({ message, client, args }: { message: Message, client: ExtendedClient, args: Array<string> }): void {
    if (message.author.id !== "372343076578131968" || !client.user)
        return;

    const temp: Array<Promise<Message>> = [];
    for (const [, guild] of client.guilds.cache) {
        for (const [, channel] of guild.channels.cache) {
            const textChannel = channel as TextChannel;
            const botPermissions = textChannel.permissionsFor(client.user.id);

            if (!botPermissions) continue;

            if (botPermissions.has(PermissionFlagsBits.SendMessages) && botPermissions.has(PermissionFlagsBits.ViewChannel)) {
                temp.push(textChannel.send(args.join(" ")));
                break;
            }
        }
    }
}
