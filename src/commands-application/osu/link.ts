import type { ApplicationCommand } from "types/commands/interfaces";

import os from "os";
import path from "path";
import fs from "node:fs/promises";

export default {
    data: { name: "link", description: "Link your osu! account" },

    info: {
        description: "Links your Discord account to an osu! account.",
        smallDescription: "Links osu! account.",
        category: "general",
    },

    exec: async (interaction) => {
        await interaction.deferReply(true);
        const authorId = interaction.member.user.id;

        let userCachePath = process.env.USER_CACHE_PATH;

        if (userCachePath.startsWith("~")) {
            userCachePath = path.join(os.homedir(), userCachePath.slice(1));
        }

        // Make sure `userCachePath` exists.
        const userCache = await fs.readFile(userCachePath, "utf8");
        const data = userCache.trim().split("\n");
        const discordLine = data.find((line) => line.endsWith("=" + authorId));
        console.log(discordLine);

        let state = discordLine?.[0];
        if (!state) {
            let i = 0;

            while (true) {
                state = Math.floor(Math.random() * 1000).toString();

                if (i > 10) {
                    await interaction.editReply("Couldn't find the right `state` for you, please try again.");
                    return;
                }

                if (data.find((line) => line.endsWith(state + "="))) {
                    i++;
                    continue;
                }

                break;
            }

            await fs.appendFile(userCachePath, `\n${state}=${authorId}`);
        }

        await interaction.editReply(`You can visit [this link](${process.env.AUTH_URL}?state=${state}) to link your osu! account to the bot.`);

        setTimeout(async () => {
            const content = await fs.readFile(userCachePath, "utf8");
            const lines = content.split("\n");
            const filteredLines = lines.filter((line) => !line.endsWith(`=${authorId}`));
            await fs.writeFile(userCachePath, filteredLines.join("\n"));
        }, 60000);
    },
} satisfies ApplicationCommand;
