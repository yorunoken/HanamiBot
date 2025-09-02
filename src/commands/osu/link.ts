import { sleep } from "bun";
import { CommandData, ApplicationCommand } from "@type/commands";
import { StateCache } from "@utils/cache";

export async function runApplication({ interaction }: ApplicationCommand) {
    await interaction.deferReply(true);

    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const state = Buffer.from(randomBytes).toString("hex");
    StateCache.set(state, interaction.member.user.id);

    const authUrl = `${process.env.OSU_AUTH_URL}?state=${state}`;
    await interaction.editReply(`You can [click here](<${authUrl}>) to link your osu! account to the bot! (expires in 10 minutes)`);

    await sleep(20 * 60 * 1000);

    await interaction.editReply("Link expired!");
    StateCache.del(state);
}

export const data = {
    name: "link",
    description: "Link your osu! account to the bot.",
    hasPrefixVariant: false,
} satisfies CommandData;
