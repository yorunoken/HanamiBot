import { cryptr } from "..";
import { auth } from "osu-api-extended";
import type { auth_scopes } from "osu-api-extended/dist/utility/types";
import type { SlashCommand } from "@lilybird/handlers";

function redirectPage(discordId: string): string {
    const scoreList: auth_scopes = ["public"];

    const url = auth.build_url(+process.env.CLIENT_ID, "https://hanami-verifier.vercel.app/auth/osu/cb", scoreList, discordId);
    return url;
}

export default {
    post: "GLOBAL",
    data: { name: "link", description: "Link your osu! account to the bot." },
    run: async (interaction) => {
        if (!interaction.inGuild()) return;
        await interaction.deferReply(true);

        const encryptedDiscordId = cryptr.encrypt(interaction.member.user.id);

        const authUrl = redirectPage(encryptedDiscordId);
        await interaction.editReply(`You can [click here](<${authUrl}>) to link your osu! account to the bot!`);
    }
} satisfies SlashCommand;
