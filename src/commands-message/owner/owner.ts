import type { Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

export default {
    name: "owner",
    description: "Owner commands.",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        await message.reply("shhhh..");
    }
} satisfies MessageCommand;
