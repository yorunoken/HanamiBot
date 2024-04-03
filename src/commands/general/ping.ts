import { client } from "@utils/initalize";
import { getStockProfile } from "@utils/osuCapital";
import type { SlashCommand } from "@lilybird/handlers";

export default {
    post: "GLOBAL",
    data: { name: "ping", description: "pong!!" },
    run: async (interaction) => {
        await interaction.deferReply();

        const { ws, rest } = await interaction.client.ping();

        const userId = 17279598;

        const osuStart = new Date().getTime();
        await client.safeParse(client.users.getUser(userId));
        const osuEnd = new Date().getTime();
        const osuDuration = osuEnd - osuStart;

        const capitalStart = new Date().getTime();
        await getStockProfile(userId);
        const capitalEnd = new Date().getTime();
        const capitalDuration = capitalStart - capitalEnd;

        await interaction.editReply({
            content: `🏓 WebSocket: \`${ws}ms\` | Rest: \`${rest}ms\`\nosu! API: \`${osuDuration}ms\` | osu!Capital API: ${capitalDuration}ms`
        });
    }
} satisfies SlashCommand;
