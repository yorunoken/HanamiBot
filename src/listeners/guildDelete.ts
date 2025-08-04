import { removeEntry } from "@utils/database";
import { Tables } from "@type/database";
import type { Event } from "@lilybird/handlers";
import { GuildPrefixCache } from "@utils/redis";

export default {
    event: "guildDelete",
    run: async (_, guild) => {
        removeEntry(Tables.GUILD, guild.id);
        try {
            await GuildPrefixCache.del(guild.id);
        } catch (error) {
            console.error(`Failed to remove guild ${guild.id} from prefix cache:`, error);
        }
    },
} satisfies Event<"guildDelete">;
