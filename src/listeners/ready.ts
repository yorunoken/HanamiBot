import { loadMessageCommands } from "../utils/initalize";
import type { Event } from "@lilybird/handlers";

export default {
    event: "ready",
    run: async (client) => {
        console.log(`Successfully logged in as ${client.user.username} ✅`);
        await loadMessageCommands();
        console.log("Loaded message commands ✅");
        console.log("Put prefixes ✅");
        console.log("Checked for new servers ✅");
    }
} satisfies Event<"ready">;
