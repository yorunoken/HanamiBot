import { loadCommands, refreshGuildsDatabase, loadGuildPrefixes } from "@utils/initalize";
import { logger } from "@utils/logger";
import type { Event } from "@lilybird/handlers";

export default {
    event: "ready",
    run: async (client) => {
        logger.info(`Successfully logged in as ${client.user.username} ✅`);
        await loadCommands(client);
        logger.info("Loaded commands ✅");
        refreshGuildsDatabase();
        logger.info("Refreshed servers database ✅");
        await loadGuildPrefixes();
    },
} satisfies Event<"ready">;
