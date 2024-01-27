import type { Client, Message } from "lilybird";

export interface MessageCommands {
    name: string;
    aliases?: Array<string>;
    cooldown: number;
    description: string;
    // category: string;
    flags?: string;
    run: ({ client, message, args, prefix, index, commandName }: { client: Client, message: Message, args: Array<string>, prefix: string, index: number | undefined, commandName: string }) => Promise<void>;
}

export interface DefaultMessageCommands {
    default: MessageCommands;
}
