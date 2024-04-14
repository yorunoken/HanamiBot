import type { ApplicationCommandData, GuildInteraction, GuildTextChannel, Message } from "@lilybird/transformers";
import type { Client, POSTApplicationCommandStructure } from "lilybird";

export interface MessageCommand {
    name: string;
    aliases?: Array<string>;
    cooldown: number;
    description: string;
    // category: string;
    flags?: string;
    run: ({ client, message, args, prefix, index, commandName, channel }:
    { client: Client, message: Message, args: Array<string>, prefix: string, index: number | undefined, commandName: string, channel: GuildTextChannel }) => Promise<void>;
}

type Awaitable<T> = Promise<T> | T;

export interface SlashCommand {
    data: POSTApplicationCommandStructure;
    run: (interaction: GuildInteraction<ApplicationCommandData>) => Awaitable<any>;
}

export interface DefaultSlashCommand {
    default: SlashCommand;
}

export interface DefaultMessageCommand {
    default: MessageCommand;
}
