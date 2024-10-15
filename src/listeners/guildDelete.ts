import { removeEntry } from "@utils/database";
import { Tables } from "@type/database";
import type { Event } from "@lilybird/handlers";

export const prefixesCache = new Map<string, Array<string>>();

export default {
    event: "guildDelete",
    run: (_, guild) => {
        removeEntry(Tables.GUILD, guild.id);
    },
} satisfies Event<"guildDelete">;
