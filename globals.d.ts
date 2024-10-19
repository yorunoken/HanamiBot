declare module "bun" {
    interface Env {
        DISCORD_BOT_TOKEN: string;
        ERROR_CHANNEL_ID: string;

        ACCESS_TOKEN: string;
        CLIENT_SECRET: string;
        CLIENT_ID: string;
        AUTH_CALLBACK_URL: string;

        DEV?: string;
    }
}

declare module "*.db" {
    var db: import("bun:sqlite").Database;
    export = db;
}
