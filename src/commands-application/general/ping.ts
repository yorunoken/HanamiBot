import type { ApplicationCommand } from "types/commands/interfaces";

export default {
    data: { name: "ping", description: "pong!!" },

    info: {
        description: "Simplest command, it's generally used to check if the bot is alive.\nIt will show the bot's latency in milliseconds.",
        smallDescription: "Check the bot's latency.",
        category: "general",
    },

    exec: async (interaction) => {
        await interaction.deferReply();

        const { ws, rest } = await interaction.client.ping();

        await interaction.editReply({
            content: `🏓 WebSocket: \`${ws.toFixed()}ms\` | Rest: \`${rest.toFixed()}ms\``,
        });
    },
} satisfies ApplicationCommand;
