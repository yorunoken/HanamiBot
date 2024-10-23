declare module "bun" {
    interface Env {
        DISCORD_BOT_TOKEN: string;
        ERROR_CHANNEL_ID: string;

        ACCESS_TOKEN: string;
        CLIENT_SECRET: string;
        CLIENT_ID: string;

        USER_CACHE_PATH: string;
        AUTH_URL: string;

        DEV?: string;
    }
}

declare module "*.db" {
    var db: import("bun:sqlite").Database;
    export = db;
}
