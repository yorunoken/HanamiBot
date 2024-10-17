import { initializeDatabase, loadLogs } from "./utils/initalize";
import { createHandler } from "@lilybird/handlers/simple";
import { CachingDelegationType, createClient, Intents } from "lilybird";
import { Channel, Guild, GuildVoiceChannel } from "@lilybird/transformers";
import { $ } from "bun";
import { chromium } from "playwright";
import { auth } from "osu-api-extended";
import { writeFile } from "node:fs/promises";

await auth.login({
    type: "v2",
    client_id: +process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    scopes: ["public"],
});

// make sure chromium is dead
try {
    await $`pkill chromium && pkill chromium-browser`;
} catch (e) {}

export const browser = await chromium.launch();

process.on("unhandledRejection", async (error: Error) => {
    await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
});
process.on("uncaughtException", async (error: Error) => {
    await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
});

initializeDatabase();

if (process.env.DEV !== "1") await writeFile("/root/users_cache.txt", "");

const listeners = await createHandler({
    dirs: {
        listeners: `${import.meta.dir}/listeners`,
    },
});

await createClient({
    token: process.env.DISCORD_BOT_TOKEN,
    caching: {
        transformerTypes: { channel: Channel, guild: Guild, voiceState: GuildVoiceChannel },
        delegate: CachingDelegationType.DEFAULT,
        applyTransformers: true,
        enabled: { channel: true },
    },
    intents: [Intents.GUILDS, Intents.GUILD_MESSAGES, Intents.MESSAGE_CONTENT, Intents.GUILD_MEMBERS],
    ...listeners,
});
