import { getEntry, insertData, removeEntry } from "@utils/database";
import { Tables } from "@type/database";
import type { Guild } from "@type/database";
import type { Event } from "@lilybird/handlers";
import { GuildPrefixCache } from "@utils/redis";

export default {
    event: "guildCreate",
    run: async (guild) => {
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

        if (document !== null && document.prefixes !== null) {
            try {
                await GuildPrefixCache.set(guild.id, document.prefixes);
            } catch (error) {
                console.error(`Failed to cache prefixes for guild ${guild.id}:`, error);
            }
        }
    },
} satisfies Event<"guildCreate">;
