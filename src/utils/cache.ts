import type { EmbedBuilderOptions } from "@type/embedBuilders";
import { ButtonStateCache } from "@utils/redis";

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
        ButtonStateCache.set(messageId, options).catch(console.error);
    }

    delete(messageId: string): void {
        this.cache.delete(messageId);
        ButtonStateCache.del(messageId).catch(console.error);
    }

    has(messageId: string): boolean {
        return this.cache.has(messageId);
    }
}

export const mesageDataForButtonsSync = new SyncMapProxy();
