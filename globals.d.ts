declare module "bun" {
    interface Env {
        DISCORD_BOT_TOKEN: string;
        ACCESS_TOKEN: string;
        CLIENT_SECRET: string;
        CLIENT_ID: string;
        AUTH_URL: string;
        ERROR_CHANNEL_ID: string;
        OWNER_ID: string;
        DEV?: string;
    }
}

declare module "*.db" {
    const db: import("bun:sqlite").Database;
    export = db;
}
