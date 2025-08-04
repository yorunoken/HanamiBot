import { loadApplicationCommands, loadMessageCommands, refreshGuildsDatabase, loadGuildPrefixes } from "@utils/initalize";
import { logger } from "@utils/logger";
import type { Event } from "@lilybird/handlers";

export default {
    event: "ready",
    run: async (client) => {
        logger.info(`Successfully logged in as ${client.user.username} ✅`);
        logger.info("Setting up logs...");
        logger.info("Started the bot.");
        logger.info("Prepared logs ✅");
        await loadMessageCommands();
        logger.info("Loaded message commands ✅");
        await loadApplicationCommands(client);
        logger.info("Loaded application commands ✅");
        refreshGuildsDatabase();
        logger.info("Refreshed servers database ✅");
        await loadGuildPrefixes();
        logger.info("Loaded guild prefixes into cache ✅");
    },
} satisfies Event<"ready">;
