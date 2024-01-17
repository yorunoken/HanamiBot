import { initializeDatabase } from "./utils/database";
import { createHandler } from "@lilybird/handlers";
import { createClient, Intents } from "lilybird";
import { Database } from "bun:sqlite";
import Cryptr from "cryptr";
import { auth } from "osu-api-extended";

export const cryptr = new Cryptr(process.env.ENCRYPT_SECRET, { saltLength: 10 });

export const db = new Database("./src/data.db");
initializeDatabase();
console.log("Database up and running!");

// Make sure bubu will not crash
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const listeners = await createHandler({
    prefix: "!",
    dirs: {
        slashCommands: `${import.meta.dir}/commands`,
        messageCommands: `${import.meta.dir}/commands-message`,
        listeners: `${import.meta.dir}/listeners`
    }
});

await auth.login(+process.env.CLIENT_ID, process.env.CLIENT_SECRET, ["public"]);

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

