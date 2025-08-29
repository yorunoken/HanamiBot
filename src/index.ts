import { initializeDatabase, client } from "@utils/initalize";
import { logger } from "@utils/logger";
import { getAccessToken } from "@utils/osu";
import { initializeRedis, closeRedis } from "@utils/cache";
import { createHandler } from "@lilybird/handlers/simple";
import { CachingDelegationType, createClient, Intents } from "lilybird";
import { Channel, Guild, GuildVoiceChannel } from "@lilybird/transformers";
import { $ } from "bun";
import { chromium } from "playwright";

// refresh token every hour
setInterval(setToken, 1000 * 60 * 60);

async function setToken(): Promise<void> {
    const tokenResult = await getAccessToken(+process.env.OSU_CLIENT_ID, process.env.OSU_CLIENT_SECRET, ["public"]);
    if (!tokenResult) {
        throw new Error("Failed to get access token");
    }
    const { accessToken } = tokenResult;
    client.setAccessToken(accessToken);
}

await setToken();

// Initialize Redis
await initializeRedis();

// make sure chromium is dead
try {
    await $`pkill chromium && pkill chromium-browser`;
} catch {
    // don't do anything
}

export const browser = await chromium.launch();

process.on("unhandledRejection", async (error: Error) => {
    await logger.fatal("Unhandled promise rejection", error);
});
process.on("uncaughtException", async (error: Error) => {
    await logger.fatal("Uncaught exception", error);
});

// graceful shutdown

process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down gracefully...");
    try {
        await browser.close();
        logger.info("Browser closed");
        await closeRedis();
        await logger.flush();
        process.exit(0);
    } catch (error) {
        logger.error("Error during shutdown", error as Error);
        process.exit(1);
    }
});

process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down gracefully...");
    try {
        await browser.close();
        logger.info("Browser closed");
        await closeRedis();
        await logger.flush();
        process.exit(0);
    } catch (error) {
        logger.error("Error during shutdown", error as Error);
        process.exit(1);
    }
});

initializeDatabase();

const listeners = await createHandler({
    dirs: {
        listeners: `${import.meta.dir}/listeners`,
    },
});

// I'll need to upgrade to the latest version soon enough.
await createClient({
    token: process.env.DISCORD_BOT_TOKEN,
    caching: {
        transformerTypes: { channel: Channel, guild: Guild, voiceState: GuildVoiceChannel },
        delegate: CachingDelegationType.DEFAULT,
        applyTransformers: true,
        enabled: { channel: true },
    },
    intents: [Intents.GUILDS, Intents.GUILD_MESSAGES, Intents.MESSAGE_CONTENT],
    ...listeners,
});
