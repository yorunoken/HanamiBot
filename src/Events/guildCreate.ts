import { ChannelType, Guild, PermissionFlagsBits, TextChannel } from "discord.js";
import { serverJoinMessage } from "../constants";
import { ExtendedClient } from "../Structure";
import BaseEvent from "../Structure/BaseEvent";

export default class GuildCreateEvent extends BaseEvent {
  constructor(client: ExtendedClient) {
    super(client);
  }

  public execute(guild: Guild) {
    for (
      let [_, channel] of guild.channels.cache
    ) {
      channel = channel as TextChannel;
      const botPermissions = channel.permissionsFor(this.client.user!.id);
      if (!botPermissions) return;

      if (channel.type === ChannelType.GuildText && botPermissions.has(PermissionFlagsBits.SendMessages) && botPermissions.has(PermissionFlagsBits.ViewChannel)) {
        channel.send(serverJoinMessage(this.client));
        return;
      }
    }
  }
}
