import { getServer, insertData } from "../utils/database";
import type { Event } from "@lilybird/handlers";

export const prefixesCache = new Map<string, Array<string>>();
export function updatePrefixCache(key: string, value: Array<string>): void {
    prefixesCache.set(key, value);
}

export default {
    event: "guildCreate",
    run: (guild) => {
        const document = getServer(guild.id);
        if (!document)
            insertData({ table: "servers", id: guild.id, data: [ { name: "prefixes", value: null } ] });
        else if (document.prefixes !== null && !Array.isArray(document.prefixes))
            prefixesCache.set(guild.id, JSON.parse(document.prefixes) as Array<string>);
    }
} satisfies Event<"guildCreate">;
