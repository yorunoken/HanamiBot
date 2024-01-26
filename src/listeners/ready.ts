import { loadMessageCommands } from "../utils/initalize";
import type { MessageCommands } from "../types/commands";
import type { Event } from "@lilybird/handlers";

export const messageCommands = new Map<string, MessageCommands>();
export const commandAliases = new Map();

export function setMapData(aliasBool: boolean, key: string, value: MessageCommands | string): void {
    (!aliasBool ? messageCommands : commandAliases).set(key, value);
}

export default {
    event: "ready",
    run: async (client) => {
        console.log(`Successfully logged in as ${client.user.username} ✅`);
        await loadMessageCommands();
        console.log("Loaded message commands ✅");
        // checkServers(client);
        console.log("Checked for new servers ✅");
    }
} satisfies Event<"ready">;
