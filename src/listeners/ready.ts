import { loadApplicationCommands, loadLogs, loadMessageCommands, refreshGuildsDatabase, loadGuildPrefixes } from "@utils/initalize";
import type { Event } from "@lilybird/handlers";

export default {
    event: "ready",
    run: async (client) => {
        console.log(`Successfully logged in as ${client.user.username} ✅`);
        console.log("Setting up Logs..");
        await loadLogs("Started the bot.");
        console.log("Prepared logs ✅");
        await loadMessageCommands();
        console.log("Loaded message commands ✅");
        await loadApplicationCommands(client);
        console.log("Loaded application commands ✅");
        refreshGuildsDatabase();
        console.log("Refreshed servers database ✅");
        await loadGuildPrefixes();
        console.log("Loaded guild prefixes into cache ✅");
    },
} satisfies Event<"ready">;
