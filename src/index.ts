
/**
    Hello! This is Hanami, a Discord bot written in TypeScript, using the Bun runtime engine.
    I mainly wrote this bot for my friends,
    but realized the potential it had, and decided to expand it. (Like no one else has writte an osu! Discord bot before, lol.)

    So now, we're here. Hopefuly it meets your expectations.
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

import { initializeDatabase } from "./utils/initalize";
import { createHandler } from "@lilybird/handlers";
import { createClient, Intents } from "lilybird";
import Cryptr from "cryptr";
import { auth } from "osu-api-extended";

export const cryptr = new Cryptr(process.env.ENCRYPT_SECRET, { saltLength: 10 });

// Make sure bubu will not crash
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

initializeDatabase();

const listeners = await createHandler({
    dirs: {
        slashCommands: `${import.meta.dir}/commands`,
        listeners: `${import.meta.dir}/listeners`
    }
});

await auth.login(+process.env.CLIENT_ID, process.env.CLIENT_SECRET, ["public"]);

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

