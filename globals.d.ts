declare module "bun" {
    interface Env {
        DISCORD_BOT_TOKEN: string;
        OSU_ACCESS_TOKEN: string;
        OSU_CLIENT_SECRET: string;
        OSU_CLIENT_ID: string;
        OSU_AUTH_URL: string;
        ERROR_CHANNEL_ID: string;
        OWNER_ID: string;
        DEV?: string;
    }
}

declare module "@db" {
    const db: import("bun:sqlite").Database;
    export default db;
}
