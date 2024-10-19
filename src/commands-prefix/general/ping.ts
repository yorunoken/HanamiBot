import type { PrefixCommand } from "types/commands/interfaces";

export default {
    data: {
        name: "ping",
        aliases: ["p"],
        cooldownMs: 1000,
    },

    info: {
        description: "Simplest command, it's generally used to check if the bot is alive.\nIt will show the bot's latency in milliseconds.",
        smallDescription: "Check the bot's latency.",
        category: "general",
    },

    exec: async ({ message }) => {
        const newMessage = await message.reply({
            content: "🏓...",
        });

        const { ws, rest } = await message.client.ping();

        await newMessage.edit({
            content: `🏓 WebSocket: \`${ws.toFixed()}ms\` | Rest: \`${rest.toFixed()}ms\``,
        });
    },
} satisfies PrefixCommand;
