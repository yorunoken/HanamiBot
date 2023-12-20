import type { osuModes } from "..";
import type {
    MessagePayload, MessageReplyOptions, InteractionEditReplyOptions, Message,
    User as UserDiscord
} from "discord.js";

export interface InteractionHandler {
    reply: (options: string | MessagePayload | MessageReplyOptions | InteractionEditReplyOptions) => Promise<Message>;
    userArgs: Array<string>;
    author: UserDiscord;
    mode: osuModes;
    passOnly: boolean;
    index: number;
    commandName: Array<string>;
    subcommand: string | undefined;
    guildId: string | null;
    prefix: string | null | undefined;
    ppValue: number;
    ppCount: number;
    rankValue: number;
}
