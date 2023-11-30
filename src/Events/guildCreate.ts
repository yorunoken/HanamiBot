import { ChannelType, Guild, PermissionFlagsBits, TextChannel } from "discord.js";
import { serverJoinMessage } from "../constants";
import { ExtendedClient } from "../Structure";
import BaseEvent from "../Structure/BaseEvent";

// @ts-expect-error
export default class GuildCreateEvent extends BaseEvent {
  guild: Guild;
  constructor(client: ExtendedClient, guild: Guild) {
    super(client);
    this.guild = guild;
    this.fetchGuild();
  }

  private fetchGuild(): void {
    for (
      let [_, channel] of this
        .guild.channels.cache
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
