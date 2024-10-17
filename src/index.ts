import { auth } from "osu-api-extended";

// Log in to osu!
// This method will automatically refresh
await auth.login({
    type: "v2",
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    scopes: ["public"],
});

// Handle out-of-scope errors
// TODO: send the error through a Discord webhook using process.env.ERROR_CHANNEL_WEBHOOK
process.on("unhandledRejection", async (error: Error) => {
    console.error("An unhandled rejection was detected:", error);
});

process.on("uncaughtException", async (error: Error) => {
    console.error("An uncaught exception was detected:", error);
});
