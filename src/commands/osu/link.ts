import { appendFile } from "node:fs/promises";
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

    await appendFile("/root/users_cache.txt", `${state}=${interaction.member.user.id}\n`);

    const authUrl = `${process.env.CALLBACK_URL}?state=${state}`;
    await interaction.editReply(`You can [click here](<${authUrl}>) to link your osu! account to the bot!`);
    state++;
}
