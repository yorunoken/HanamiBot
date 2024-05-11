import { initializeDatabase, loadLogs, client } from "./utils/initalize";
import { getAccessToken } from "./utils/osu";
import { createHandler } from "@lilybird/handlers/simple";
import { CachingDelegationType, createClient, Intents } from "lilybird";
import { Channel, Guild, GuildVoiceChannel } from "@lilybird/transformers";
import { $ } from "bun";
import { writeFile } from "node:fs/promises";

// refresh token every hour
setInterval(setToken, 1000 * 60 * 60);

async function setToken(): Promise<void> {
    const { accessToken } = await getAccessToken(+process.env.CLIENT_ID, process.env.CLIENT_SECRET, ["public"]);
    client.setAccessToken(accessToken);
}

await setToken();

process.on("unhandledRejection", async (error: Error) => {
    await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
});
process.on("uncaughtException", async (error: Error) => {
    await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
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
    await $`pkill chromium && pkill chromium-browser`;
} catch (e) {}

