import { helpBuilder } from "@builders/help";
import type { MessageCommand } from "@type/commands";
import type { Message } from "@lilybird/transformers";

export default {
    name: "help",
    description: "Get info about the bot.",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        await message.reply({ embeds: helpBuilder() });
    }
} satisfies MessageCommand;
