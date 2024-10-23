import { Event } from "@lilybird/handlers/simple";
import { loadApplicationCommands, loadPrefixCommands } from "utils/load-commands";
import { log } from "utils/logs";

export default {
    event: "ready",
    run: async (client) => {
        await log(`Start Sequence: Started the bot as ${client.user.username}.`);

        await loadPrefixCommands();
        await log("Start Sequence: Loaded message commands");
        await loadApplicationCommands(client);
        await log("Start Sequence: Loaded application commands");
    },
} satisfies Event<"ready">;
