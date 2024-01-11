import type { SlashCommand } from "@lilybird/handlers";
import type { ApplicationCommandData, Interaction } from "lilybird";

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply();

    const { ws, rest } = await interaction.client.ping();

    await interaction.editReply({
        content: `🏓 WebSocket: \`${ws}ms\` | Rest: \`${rest}ms\``
    });
}

export default {
    post: "GLOBAL",
    data: { name: "ping", description: "pong!!" },
    run
} satisfies SlashCommand;
