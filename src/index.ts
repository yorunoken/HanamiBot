/**
    Hello! This is Hanami, a Discord bot written in TypeScript, using the Bun runtime engine.

    If you're here to contribute/look at the code, welcome!
    Although, the code is not very well documented, I tried my best!
    Feel free to open up an issue/pull request over at the main repo: https://github.com/YoruNoKen/HanamiBot

    Probably wasn't needed, but this project is liscenced with Apache version 2.0!
    You can read about it here: http://www.apache.org/licenses/
    Hope you have fun with whatever you're doing!
*/

import { initializeDatabase, loadLogs, client } from "./utils/initalize";
import { getAccessToken } from "./utils/osu";
import { createHandler } from "@lilybird/handlers";
import { createClient, Intents } from "lilybird";
import { c } from "tasai";
import { createCipheriv, randomBytes } from "node:crypto";

// refresh token every hour
setInterval(async () => {
    const { accessToken } = await getAccessToken(+process.env.CLIENT_ID, process.env.CLIENT_SECRET, ["public"]);
    client.setAccessToken(accessToken);
}, 1000 * 60 * 60);

const keyString = process.env.KEY ?? randomBytes(32);
const ivString = process.env.IV ?? randomBytes(16);

if (typeof keyString !== "undefined" || typeof ivString !== "undefined")
    console.log(c.yellow("WARNING: you are going to be using random KEY and IV. This means you won't be able to sync your encryption/decryption with your linking website."));

const key = typeof keyString === "string" ? Buffer.from(keyString.split(",").map(Number)) : keyString;
const iv = typeof ivString === "string" ? Buffer.from(ivString.split(",").map(Number)) : ivString;
const algorithm = "aes-256-cbc";

export function encrypt(text: string): string {
    const cipher = createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

process.on("unhandledRejection", async (error: Error) => {
    await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
});
process.on("uncaughtException", async (error: Error) => {
    await loadLogs(`ERROR: uncaught exception: ${error.stack}`, true);
});
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
    intents: [
        Intents.GUILDS,
        Intents.GUILD_MESSAGES,
        Intents.MESSAGE_CONTENT,
        Intents.GUILD_MEMBERS
    ],
    ...listeners
});

