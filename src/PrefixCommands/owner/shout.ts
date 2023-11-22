import { ChannelType, Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { MyClient } from "../../classes";
import { serverJoinMessage } from "../../constants";

export const name = "shout";
export const aliases = ["shout"];
export const cooldown = 0;
export const description = `Shouts at all the servers`;

export async function run({ message, client, args }: { message: Message; client: MyClient; args: string[] }) {
  if (message.author.id !== "372343076578131968") {
    return;
  }

  for (const [_, guild] of client.guilds.cache) {
    for (const [_, channel] of guild.channels.cache) {
      const textChannel = channel as TextChannel;
      const botPermissions = textChannel.permissionsFor(client.user!.id);

      if (!botPermissions) continue;

      if (textChannel.type === ChannelType.GuildText && botPermissions.has(PermissionFlagsBits.SendMessages) && botPermissions.has(PermissionFlagsBits.ViewChannel)) {
        textChannel.send(args.join(" "));
        break;
      }
    }
  }
}
