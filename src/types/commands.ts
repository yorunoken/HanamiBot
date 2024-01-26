export interface MessageCommands {
    name: string;
    aliases: Array<string>;
    cooldown: number;
    description: string;
    category: string;
    flags?: string;
    run: (options: Record<string, any>) => Promise<void>;
}
