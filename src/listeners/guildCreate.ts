import { getEntry, insertData, removeEntry } from "@utils/database";
import { Tables } from "@type/database";
import type { Guild } from "@type/database";
import type { Event } from "@lilybird/handlers";

export const prefixesCache = new Map<string, Array<string>>();

export default {
    event: "guildCreate",
    run: (guild) => {
        // Remove guild from database if it's unavailable.
        if (!("name" in guild)) {
            removeEntry(Tables.GUILD, guild.id);
            return;
        }

        const document = getEntry(Tables.GUILD, guild.id);

        const data: Array<{ key: keyof Guild; value: string | number | null }> = [
            { key: "name", value: guild.name },
            { key: "owner_id", value: guild.ownerId },
            { key: "joined_at", value: guild.joinedAt },
        ];

        if (document === null) data.push({ key: "prefixes", value: null });

        insertData({
            table: Tables.GUILD,
            id: guild.id,
            data,
        });

        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (document !== null && document.prefixes !== null) prefixesCache.set(guild.id, document.prefixes);
    },
} satisfies Event<"guildCreate">;
