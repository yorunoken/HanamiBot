import { initializeDatabase } from "./utils/initalize";
import { createHandler } from "@lilybird/handlers";
import { createClient, Intents } from "lilybird";
import Cryptr from "cryptr";
import { auth } from "osu-api-extended";

export const cryptr = new Cryptr(process.env.ENCRYPT_SECRET, { saltLength: 10 });

// Make sure bubu will not crash
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

initializeDatabase();

const listeners = await createHandler({
    dirs: {
        slashCommands: `${import.meta.dir}/commands`,
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

