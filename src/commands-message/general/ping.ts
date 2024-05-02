import { client } from "@utils/initalize";
import type { MessageCommand } from "@type/commands";

export default {
    name: "ping",
    description: "pings the bot and sees if it's alive!",
    usage: "/ping",
    cooldown: 1000,
    run: async ({ message }) => {
        const newMessage = await message.reply({
            content: "🏓..."
        });

        const { ws, rest } = await message.client.ping();

        await newMessage.edit({
            content: `🏓 WebSocket: \`${ws}ms\` | Rest: \`${rest}ms\``
        });

        const userId = 17279598;

        const osuStart = new Date().getTime();
        await client.safeParse(client.users.getUser(userId));
        const osuEnd = new Date().getTime();
        const osuDuration = osuEnd - osuStart;

        await newMessage.edit({
            content: `🏓 WebSocket: \`${ws.toFixed()}ms\` | Rest: \`${rest.toFixed()}ms\`\nosu! API: \`${osuDuration.toFixed()}ms\``
        });
    }
} satisfies MessageCommand;
