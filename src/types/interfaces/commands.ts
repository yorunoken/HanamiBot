import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";
import type { Client, ApplicationCommand } from "lilybird";

type Awaitable<T> = Promise<T> | T;

export interface PrefixCommand {
    data: {
        name: string;
        aliases?: Array<string>;
        cooldownMs: number;
    };

    info: {
        description: string;
        details?: string;
        usage: string;
        category: string;
        flags?: string;
    };

    exec: () => Awaitable<void>;
}

export interface ApplicationCommand {
    data: ApplicationCommand.Create.ApplicationCommandJSONParams;

    info: {
        description: string;
        details?: string;
        usage: string;
        category: string;
        flags?: string;
    };

    exec: (interaction: GuildInteraction<ApplicationCommandData>) => Awaitable<any>;
}

export interface DefaultApplicationCommand {
    default: ApplicationCommand;
}

export interface DefaultPrefixCommand {
    default: PrefixCommand;
}
