declare module "bun" {
    interface Env {
        TOKEN: string,
        OSU_SESSION: string,
        CLIENT_SECRET: string,
        CLIENT_ID: string,
        OWNER_DISCORDID: string,
        DEV_SERVERID: string,
        DEV_CHANNELID: string,
        ERRORS_CHANNELID: string
        OSU_DAILY_API: string
    }
}