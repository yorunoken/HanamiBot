import { checkServers } from "../utils/initalize";
import type { MessageCommands } from "../types/commands";
import type { Event } from "@lilybird/handlers";

export const messageCommands = new Map<string, MessageCommands>();
export const commandAliases = new Map();

export function setMapData(aliasBool: boolean, key: string, value: MessageCommands | string): void {
    (!aliasBool ? messageCommands : commandAliases).set(key, value);
}

export default {
    event: "guildCreate",
    run: (guild) => {
        console.log("New guild found!");
        checkServers(undefined, [guild.id]);
    }
} satisfies Event<"guildCreate">;
