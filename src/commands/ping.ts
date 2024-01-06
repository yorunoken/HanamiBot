import { ApplicationCommand } from "@lilybird/jsx";
import type { SlashCommand } from "@lilybird/handlers";

export default {
    post: "GLOBAL",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data: ApplicationCommand({ name: "ping", description: "pong!!" }),
    run: async (interaction) => {
        await interaction.deferReply();

        const { ws, rest } = await interaction.client.ping();

        await interaction.editReply({
            content: `🏓 WebSocket: \`${ws}ms\` | Rest: \`${rest}ms\``
        });
    }
} satisfies SlashCommand;
