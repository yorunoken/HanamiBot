import type { ApplicationCommandData, GuildInteraction, GuildTextChannel, Message } from "@lilybird/transformers";
import type { Client, ApplicationCommand } from "lilybird";

type Awaitable<T> = Promise<T> | T;

export interface execProps {
    client: Client;
    message: Message;
    args: Array<string>;
    prefix: string;
    index: number | undefined;
    commandName: string;
    channel: GuildTextChannel;
}

export interface PrefixCommand {
    data: {
        name: string;
        aliases?: Array<string>;
        cooldownMs: number;
    };

    info: {
        description: string;
        smallDescription: string;
        category: string;
        howToUse?: string;
        usageExample?: string;
    };

    exec: ({ client, message, args, prefix, index, commandName, channel }: execProps) => Awaitable<void>;
}

export interface ApplicationCommand {
    data: ApplicationCommand.Create.ApplicationCommandJSONParams;

    info: {
        description: string;
        smallDescription: string;
        arguments?: Array<Record<string, string>>;
        category: string;
    };

    exec: (interaction: GuildInteraction<ApplicationCommandData>) => Awaitable<any>;
}

export interface DefaultApplicationCommand {
    default: ApplicationCommand;
}

export interface DefaultPrefixCommand {
    default: PrefixCommand;
}
