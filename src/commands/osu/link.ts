import { encrypt } from "../..";
import { buildAuthUrl } from "../../utils/osu";
import type { AuthScope } from "../../types/osu";
import type { SlashCommand } from "@lilybird/handlers";
import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export default {
    post: "GLOBAL",
    data: { name: "link", description: "Link your osu! account to the bot." },
    run
} satisfies SlashCommand;

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;
    await interaction.deferReply(true);

    const encryptedDiscordId = `${encrypt(interaction.member.user.id)}`;

    const authUrl = buildRedirectPage(encryptedDiscordId);
    await interaction.editReply(`You can [click here](<${authUrl}>) to link your osu! account to the bot!`);
}

function buildRedirectPage(discordId: string): string {
    const scoreList: Array<AuthScope> = ["public"];

    return buildAuthUrl(+process.env.CLIENT_ID, process.env.CALLBACK_URL, scoreList, discordId);
}
