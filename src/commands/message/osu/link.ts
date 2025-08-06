import type { Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";
import { StateCache } from "@utils/cache";
import { logger } from "@utils/logger";

export default {
    name: "link",
    description: "Link your osu! account",
    usage: "/link",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        const randomBytes = crypto.getRandomValues(new Uint8Array(32));
        const state = Buffer.from(randomBytes).toString("hex");
        await StateCache.set(state, message.author.id);

        const authUrl = `${process.env.AUTH_URL}?state=${state}`;
        const msg = await message.reply(`You can [click here](<${authUrl}>) to link your osu! account to the bot! (expires in 10 minutes)`);

        let isCompleted = false;

        // Check every 5 seconds if the state cache still exists
        const checkInterval = setInterval(async () => {
            if (isCompleted) return;

            try {
                const stateExists = await StateCache.exists(state);
                if (!stateExists) {
                    // State cache no longer exists, assume link was used
                    isCompleted = true;
                    clearInterval(checkInterval);
                    await msg.edit("Account linked successfully!");
                    return;
                }
            } catch (error) {
                logger.error("Error checking state cache:", error as Error);
            }
        }, 5000);

        // Set a timeout for 10 minutes (600 seconds) with automatic cleanup
        const timeoutId = setTimeout(
            async () => {
                if (isCompleted) return;

                isCompleted = true;
                clearInterval(checkInterval);

                try {
                    const stateExists = await StateCache.exists(state);
                    if (stateExists) {
                        await msg.edit("Link expired!");
                        await StateCache.del(state);
                    }
                } catch (error) {
                    logger.error("Error during timeout cleanup:", error as Error);
                }
            },
            10 * 60 * 1000,
        );

        // Cleanup function to prevent memory leaks
        const cleanup = () => {
            if (!isCompleted) {
                isCompleted = true;
                clearInterval(checkInterval);
                clearTimeout(timeoutId);
            }
        };

        // Cleanup on process termination to prevent memory leaks
        process.once("SIGINT", cleanup);
        process.once("SIGTERM", cleanup);
    },
} satisfies MessageCommand;
