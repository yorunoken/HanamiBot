import { serverJoinMessage } from "../constants";
import BaseEvent from "../Structure/BaseEvent";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import type { Guild } from "discord.js";
import type { ExtendedClient } from "../Structure";

export default class GuildCreateEvent extends BaseEvent {
    public constructor(client: ExtendedClient) {
        super(client);
    }

    public async execute(guild: Guild): Promise<void> {
        if (!this.client.user) return;
        const temp: Array<Promise<unknown>> = [];

        for (let i = 0, vals = [...guild.channels.cache.values()], len = vals.length; i < len; i++) {
            const channel = vals[i];
            const botPermissions = channel.permissionsFor(this.client.user.id);
            if (!botPermissions) return;
            if (channel.type === ChannelType.GuildText && botPermissions.has(PermissionFlagsBits.SendMessages) && botPermissions.has(PermissionFlagsBits.ViewChannel))
                temp.push(channel.send(serverJoinMessage(this.client)));
        }

        await Promise.all(temp);
    }
}
