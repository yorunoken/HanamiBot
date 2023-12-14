import { ExtendedClient } from "./Structure/index";
import { GatewayIntentBits } from "discord.js";
import { auth } from "osu-api-extended";

const { CLIENT_SECRET, CLIENT_ID, TOKEN } = Bun.env;

async function main(): Promise<void> {
    const client = new ExtendedClient({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.MessageContent
        ]
    });

    await auth.login(parseInt(CLIENT_ID), CLIENT_SECRET, ["public"]);

    process.on("unhandledRejection", (e) => {
        console.error(e);
    });
    process.on("uncaughtException", (e) => {
        console.error(e);
    });
    process.on("uncaughtExceptionMonitor", (e) => {
        console.error(e);
    });

    await client.login(TOKEN);
}

main().catch((e) => { console.error(e); });
