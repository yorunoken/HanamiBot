import { loadApplicationCommands, loadLogs, loadMessageCommands } from "../utils/initalize";
import type { Event } from "@lilybird/handlers";

export default {
    event: "ready",
    run: async (client) => {
        console.log(`Successfully logged in as ${client.user.username} ✅`);
        await loadLogs();
        console.log("Prepared logs ✅");
        await loadMessageCommands();
        console.log("Loaded message commands ✅");
        await loadApplicationCommands(client);
        console.log("Loaded application commands ✅");
        console.log("Put prefixes ✅");
        console.log("Checked for new servers ✅");
    }
} satisfies Event<"ready">;
