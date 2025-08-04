import type { ApplicationCommandData, GuildInteraction, GuildTextChannel, Message } from "@lilybird/transformers";
import type { Client, ApplicationCommand } from "lilybird";

type Awaitable<T> = Promise<T> | T;

export interface MessageCommand {
    name: string;
    aliases?: Array<string>;
    cooldown: number;
    description: string;
    details?: string;
    usage: string;
    // category: string;
    flags?: string;
    run: ({
        client,
        message,
        args,
        prefix,
        index,
        commandName,
        channel,
    }: {
        client: Client;
        message: Message;
        args: Array<string>;
        prefix: string;
        index: number | undefined;
        commandName: string;
        channel: GuildTextChannel;
    }) => Awaitable<void>;
}

export interface SlashCommand {
    data: ApplicationCommand.Create.ApplicationCommandJSONParams;
    run: (interaction: GuildInteraction<ApplicationCommandData>) => Awaitable<any>;
}

export interface DefaultSlashCommand {
    default: SlashCommand;
}

export interface DefaultMessageCommand {
    default: MessageCommand;
}
