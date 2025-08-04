import type { EmbedBuilderOptions } from "@type/embedBuilders";
import { ButtonStateCache } from "@utils/redis";
import { logger } from "@utils/logger";

export const slashCommandsIds = new Map<string, string>();

// Legacy export for backward compatibility - use ButtonStateCache directly for new code
export const mesageDataForButtons = {
    async get(messageId: string): Promise<EmbedBuilderOptions | undefined> {
        const result = await ButtonStateCache.get<EmbedBuilderOptions>(messageId);
        return result ?? undefined;
    },

    async set(messageId: string, options: EmbedBuilderOptions): Promise<void> {
        await ButtonStateCache.set(messageId, options);
    },

    async delete(messageId: string): Promise<void> {
        await ButtonStateCache.del(messageId);
    },
};

// For synchronous code that still needs Map-like interface
export class SyncMapProxy {
    private cache = new Map<string, EmbedBuilderOptions>();

    get(messageId: string): EmbedBuilderOptions | undefined {
        return this.cache.get(messageId);
    }

    set(messageId: string, options: EmbedBuilderOptions): void {
        this.cache.set(messageId, options);
        // Asynchronously sync to Redis
        ButtonStateCache.set(messageId, options).catch((error) => {
            logger.error(`Failed to cache button state for message ${messageId}`, error as Error);
        });
    }

    delete(messageId: string): void {
        this.cache.delete(messageId);
        ButtonStateCache.del(messageId).catch((error) => {
            logger.error(`Failed to delete button state cache for message ${messageId}`, error as Error);
        });
    }

    has(messageId: string): boolean {
        return this.cache.has(messageId);
    }
}

export const mesageDataForButtonsSync = new SyncMapProxy();
