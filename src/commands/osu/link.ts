import { sleep } from "bun";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import type { SlashCommand } from "@type/commands";
import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";

export default {
    data: { name: "link", description: "Link your osu! account to the bot." },
    run
} satisfies SlashCommand;

let state = 1;

async function run(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply(true);

    if (process.env.DEV === "1") {
        await interaction.editReply("This command doesn't work in dev mode.");
        return;
    }

    const cacheLocation = "/root/users_cache.txt";

    await appendFile(cacheLocation, `${state}=${interaction.member.user.id}\n`);

    const authUrl = `${process.env.CALLBACK_URL}?state=${state}`;
    await interaction.editReply(`You can [click here](<${authUrl}>) to link your osu! account to the bot! (expires in 20 seconds)`);
    state++;

    await sleep(20 * 1000);

    const data = await readFile(cacheLocation, "utf-8");
    const lines = data.split("\n").filter((line) => line !== `${state}=${interaction.member.user.id}`);
    const updatedData = lines.join("\n");
    await writeFile(cacheLocation, updatedData);

    await interaction.editReply("Link expired!");
}
