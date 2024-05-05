/**
    Hello! This is Hanami, a Discord bot written in TypeScript, using the Bun runtime engine.

    If you're here to contribute/look at the code, welcome!
    Although, the code is not very well documented, I tried my best!
    Feel free to open up an issue/pull request over at the main repo: https://github.com/YoruNoKen/HanamiBot

    Probably wasn't needed, but this project is liscenced with Apache version 2.0!
    You can read about it here: http://www.apache.org/licenses/
    Hope you have fun with whatever you're doing!
*/

import { initializeDatabase, loadLogs, client } from "./utils/initalize";
import { getAccessToken } from "./utils/osu";
import { createHandler } from "@lilybird/handlers/simple";
import { CachingDelegationType, createClient, Intents } from "lilybird";
import { Channel, Guild, GuildVoiceChannel } from "@lilybird/transformers";
import { $ } from "bun";
import { writeFile } from "node:fs/promises";

// refresh token every hour
setInterval(async () => {
    const { accessToken } = await getAccessToken(+process.env.CLIENT_ID, process.env.CLIENT_SECRET, ["public"]);
    client.setAccessToken(accessToken);
}, 1000 * 60 * 60);

process.on("unhandledRejection", async (error: Error) => {
    await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
});
process.on("uncaughtException", async (error: Error) => {
    await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
});
process.on("exit", async (code: number) => {
    await loadLogs(`ERROR: the client exited with code ${code}`, true);
});

initializeDatabase();

if (process.env.DEV !== "1")
    await writeFile("/root/users_cache.txt", "");

const listeners = await createHandler({
    dirs: {
        listeners: `${import.meta.dir}/listeners`
    }
});

await createClient({
    token: process.env.DISCORD_BOT_TOKEN,
    caching: {
        transformerTypes: { channel: Channel, guild: Guild, voiceState: GuildVoiceChannel },
        delegate: CachingDelegationType.DEFAULT,
        applyTransformers: true,
        enabled: { channel: true }
    },
    intents: [
        Intents.GUILDS,
        Intents.GUILD_MESSAGES,
        Intents.MESSAGE_CONTENT,
        Intents.GUILD_MEMBERS
    ],
    ...listeners
});

// make sure chromium is dead
try {
    await $`pkill chromium`;
    await $`pkill chromium-browser`;
} catch (e) {}

