import Valkey from "iovalkey";
import { logger } from "@utils/logger";

// Map caches
export const guildPrefixesCache = new Map<string, Array<string>>();
export const cooldownsCache = new Map<string, number>();
export const slashCommandIdsCache = new Map<string, string>();

// Clear cooldown cache every hour
setInterval(
    () => {
        const now = Date.now();
        for (const [key, expiresAt] of cooldownsCache.entries()) {
            if (expiresAt <= now) {
                cooldownsCache.delete(key);
            }
        }
    },
    5 * 60 * 1000,
);

// Redis client instance
let redisClient: Valkey;

export async function initializeRedis(): Promise<void> {
    logger.info("Initializing Redis connection...");

    redisClient = new Valkey({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || "0"),
        connectTimeout: 10000,
        lazyConnect: false,
    });

    // Wait for connection to be ready
    await new Promise<void>((resolve, reject) => {
        redisClient.on("ready", () => {
            logger.info("Redis connected successfully");
            resolve();
        });

        redisClient.on("error", (error) => {
            logger.error("Redis connection error:", error);
            reject(new Error(`Redis connection failed: ${error.message}`));
        });

        redisClient.on("close", () => {
            logger.warn("Redis connection closed");
        });

        redisClient.on("reconnecting", () => {
            logger.info("Redis reconnecting...");
        });

        setTimeout(() => {
            reject(new Error("Redis connection timeout after 10 seconds"));
        }, 10000);
    });
}

export function isRedisAvailable(): boolean {
    return redisClient !== null && redisClient.status === "ready";
}

export const CacheKeys = {
    GUILD_PREFIXES: (guildId: string) => `guild:${guildId}:prefixes`,
    USER_CONFIG: (userId: string) => `user:${userId}:config`,
    BEATMAP: (beatmapId: string) => `beatmap:${beatmapId}`,
    COOLDOWN: (commandName: string, userId: string) => `cooldown:${commandName}:${userId}`,
    BUTTON_STATE: (messageId: string) => `button:${messageId}:state`,
    OAUTH_TOKEN: "oauth:token",
    COMMAND_COUNT: (commandName: string, type: "slash" | "message") => `stats:${type}:${commandName}`,
} as const;

export const CacheTTL = {
    GUILD_PREFIXES: 3600, // 1 hour
    USER_CONFIG: 3600, // 1 hour
    BEATMAP: 86400, // 24 hours
    BUTTON_STATE: 3600, // 1 hour
    OAUTH_TOKEN: 3500, // ~1 hour (slightly less than actual expiry)
    COMMAND_COUNT: 300, // 5 minutes (for batching)
} as const;

export class RedisCache {
    static async get<T>(key: string): Promise<T | null> {
        if (!isRedisAvailable()) {
            throw new Error(`Redis is not available for GET operation on key: ${key}`);
        }

        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Redis GET error for key ${key}`, error as Error);
            throw error;
        }
    }

    static async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
        if (!isRedisAvailable()) {
            throw new Error(`Redis is not available for SET operation on key: ${key}`);
        }

        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await redisClient.setex(key, ttl, serialized);
            } else {
                await redisClient.set(key, serialized);
            }
            return true;
        } catch (error) {
            logger.error(`Redis SET error for key ${key}`, error as Error);
            throw error;
        }
    }

    static async del(key: string): Promise<boolean> {
        if (!isRedisAvailable()) {
            throw new Error(`Redis is not available for DEL operation on key: ${key}`);
        }

        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            logger.error(`Redis DEL error for key ${key}`, error as Error);
            throw error;
        }
    }

    static async exists(key: string): Promise<boolean> {
        if (!isRedisAvailable()) {
            throw new Error(`Redis is not available for EXISTS operation on key: ${key}`);
        }

        try {
            const result = await redisClient.exists(key);
            return result === 1;
        } catch (error) {
            logger.error(`Redis EXISTS error for key ${key}`, error as Error);
            throw error;
        }
    }

    static async increment(key: string, ttl?: number): Promise<number> {
        if (!isRedisAvailable()) {
            throw new Error(`Redis is not available for INCR operation on key: ${key}`);
        }

        try {
            const result = await redisClient.incr(key);
            if (ttl && result === 1) {
                await redisClient.expire(key, ttl);
            }
            return result;
        } catch (error) {
            logger.error(`Redis INCR error for key ${key}`, error as Error);
            throw error;
        }
    }

    static async setTTL(key: string, ttl: number): Promise<boolean> {
        if (!isRedisAvailable()) {
            throw new Error(`Redis is not available for EXPIRE operation on key: ${key}`);
        }

        try {
            await redisClient.expire(key, ttl);
            return true;
        } catch (error) {
            logger.error(`Redis EXPIRE error for key ${key}`, error as Error);
            throw error;
        }
    }
}

// Specialized cache classes for different data types
export class ButtonStateCache {
    static async get<T>(messageId: string): Promise<T | null> {
        return RedisCache.get<T>(CacheKeys.BUTTON_STATE(messageId));
    }

    static async set<T>(messageId: string, value: T): Promise<boolean> {
        return RedisCache.set(CacheKeys.BUTTON_STATE(messageId), value, CacheTTL.BUTTON_STATE);
    }

    static async del(messageId: string): Promise<boolean> {
        return RedisCache.del(CacheKeys.BUTTON_STATE(messageId));
    }
}

export async function closeRedis(): Promise<void> {
    if (redisClient && redisClient.status !== "end") {
        try {
            await redisClient.quit();
            logger.info("Redis connection closed gracefully");
        } catch (error) {
            logger.error("Error closing Redis connection", error as Error);
            redisClient.disconnect();
        }
    }
}
