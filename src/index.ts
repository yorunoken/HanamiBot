/**
    Hello! This is Hanami, a Discord bot written in TypeScript, using the Bun runtime engine.
    I mainly wrote this bot for my friends, but realized the potential it had, and decided to expand it. (Like no one else has written an osu! Discord bot before, lol.)

    So now, we're here. Hopefully it meets your expectations.
    If you're here to contribute/look at the code, welcome!
    Although, the code is not very well documented, I tried my best!
    Feel free to open up an issue/pull request over at the main repo: https://github.com/YoruNoKen/HanamiBot

    Probably wasn't needed, but this project is liscenced with Apache version 2.0!
    You can read about it here: http://www.apache.org/licenses/

    I'm using Lilybird to communicate with Discord's API.
    Lilybird is a Discord API wrapper my friend coded, and it's quite good.

    I use a mixture of osu-api-extended, and osu-web.js to communicate with osu!s servers.

    Hope you have fun with whatever you're doing!
*/

import { initializeDatabase, loadLogs, client } from "./utils/initalize";
import { getAccessToken } from "./utils/osu";
import { createHandler } from "@lilybird/handlers";
import { createClient, Intents } from "lilybird";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// refresh token every 4 hours
setInterval(async () => {
    const { accessToken } = await getAccessToken(+process.env.CLIENT_ID, process.env.CLIENT_SECRET, ["public"]);
    client.setAccessToken(accessToken);
}, 1000 * 60 * 60 * 4);

const key = randomBytes(32);
const iv = randomBytes(16);

export const encrypt = createCipheriv("aes256", key, iv);
export const decrypt = createDecipheriv("aes256", key, iv);

// process.on("unhandledRejection", async (error: Error) => {
//     await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
// });
// process.on("uncaughtException", async (error: Error) => {
//     await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
// });
process.on("exit", async (code: number) => {
    await loadLogs(`ERROR: the client exited with code ${code}`, true);
});

initializeDatabase();

const listeners = await createHandler({
    dirs: {
        listeners: `${import.meta.dir}/listeners`
    }
});

await createClient({
    token: process.env.DISCORD_BOT_TOKEN,
    attachDebugListener: true,
    intents: [
        Intents.GUILDS,
        Intents.GUILD_MESSAGES,
        Intents.MESSAGE_CONTENT,
        Intents.GUILD_MEMBERS
    ],
    ...listeners
});

