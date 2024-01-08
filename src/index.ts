import { initializeDatabase } from "./utils";
import { createHandler } from "@lilybird/handlers";
import { createClient, Intents } from "lilybird";
import { Database } from "bun:sqlite";

export const db = new Database("./src/data.db");
initializeDatabase();
console.log("Database up and running!");

// Make sure bubu will not crash
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const listeners = await createHandler({
    dirs: {
        slashCommands: `${import.meta.dir}/commands`,
        messageCommands: `${import.meta.dir}/message-commands`,
        listeners: `${import.meta.dir}/listeners`
    }
});

await createClient({
    token: process.env.DISCORD_BOT_TOKEN,
    intents: [
        Intents.GUILDS,
        Intents.GUILD_MESSAGES,
        Intents.MESSAGE_CONTENT,
        Intents.GUILD_MEMBERS
    ],
    ...listeners
});

