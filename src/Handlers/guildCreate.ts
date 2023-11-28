import { ChannelType, Guild, PermissionFlagsBits, TextChannel } from "discord.js";
import { MyClient } from "../classes";
import { serverJoinMessage } from "../constants";

export const name = "guildCreate";
export const execute = async (guild: Guild, client: MyClient) => {
  guild.channels.cache.forEach((channel) => {
    channel = channel as TextChannel;
    const botPermissions = channel.permissionsFor(client.user!.id);
    if (!botPermissions) return;

    if (channel.type === ChannelType.GuildText && botPermissions.has(PermissionFlagsBits.SendMessages) && botPermissions.has(PermissionFlagsBits.ViewChannel)) {
      channel.send(serverJoinMessage(client));
      return;
    }
  });
};
