import { ApplicationCommand } from "@lilybird/jsx";
import { auth } from "osu-api-extended";
import type { auth_scopes } from "osu-api-extended/dist/utility/types";
import type { SlashCommand } from "@lilybird/handlers";

function redirectPage(discordId: string): string {
    const SCOPE_LIST: auth_scopes = ["public"];

    const url = auth.build_url(+process.env.CLIENT_ID, "http://localhost:8000/auth/osu/cb", SCOPE_LIST, discordId);
    return url;
}

export default {
    post: "GLOBAL",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data: ApplicationCommand({ name: "link", description: "Link your osu! account to the bot." }),
    run: async (interaction) => {
        if (!interaction.inGuild()) return;
        await interaction.deferReply();

        const authUrl = redirectPage(interaction.member.user.id);
        await interaction.editReply(`Here is your auth link: <${authUrl}>`);
    }
} satisfies SlashCommand;
