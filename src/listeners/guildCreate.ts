import { getServer, insertData, removeServer } from "@utils/database";
import type { Event } from "@lilybird/handlers";

export const prefixesCache = new Map<string, Array<string>>();

export default {
    event: "guildCreate",
    run: (guild) => {
        if (!("name" in guild)) {
            removeServer(guild.id);
            return;
        }

        const document = getServer(guild.id);

        const data: Array<{ name: string, value: string | number | null }> = [
            { name: "name", value: guild.name },
            { name: "owner_id", value: guild.ownerId },
            { name: "joined_at", value: guild.joinedAt }
        ];

        if (document === null)
            data.push({ name: "prefixes", value: null });

        insertData({
            table: "servers",
            id: guild.id,
            data
        });

        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (document !== null && document.prefixes !== null)
            prefixesCache.set(guild.id, document.prefixes);
    }
} satisfies Event<"guildCreate">;
