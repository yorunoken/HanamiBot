import type { Message } from "lilybird";
import type { MessageCommand } from "@lilybird/handlers";

async function run(message: Message): Promise<void> {
    const newMessage = await message.reply({
        content: "🏓..."
    });

    const { ws, rest } = await message.client.ping();

    await newMessage.edit({
        content: `🏓 WebSocket: \`${ws}ms\` | Rest: \`${rest}ms\``
    });
}

export default {
    name: "ping",
    run
} satisfies MessageCommand;
