import { removeServer } from "@utils/database";
import type { Event } from "@lilybird/handlers";

export const prefixesCache = new Map<string, Array<string>>();

export default {
    event: "guildDelete",
    run: (_, guild) => {
        removeServer(guild.id);
    }
} satisfies Event<"guildDelete">;
