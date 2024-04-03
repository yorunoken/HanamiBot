import { getStockProfile } from "@utils/osuCapital";
import { client } from "@utils/initalize";
import type { MessageCommand } from "@type/commands";
import type { Message } from "@lilybird/transformers";

export default {
    name: "ping",
    description: "pong!!",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
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

        const capitalStart = new Date().getTime();
        await getStockProfile(userId);
        const capitalEnd = new Date().getTime();
        const capitalDuration = capitalEnd - capitalStart;

        await newMessage.edit({
            content: `🏓 WebSocket: \`${ws}ms\` | Rest: \`${rest}ms\`\nosu! API: \`${osuDuration}ms\` | osu!Capital API: \`${capitalDuration}ms\``
        });
    }
} satisfies MessageCommand;
