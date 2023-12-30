import type { Event } from "@lilybird/handlers";

export default {
    event: "ready",
    run: (client) => {
        console.log(`Logged in as ${client.user.username} (${client.user.id})`);
    }
} satisfies Event<"ready">;
