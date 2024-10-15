import { helpBuilder } from "@builders/index";
import type { MessageCommand } from "@type/commands";

export default {
    name: "help",
    description: "Get info about the bot.",
    usage: "/help",
    cooldown: 1000,
    run: async ({ message }) => {
        await message.reply({ embeds: helpBuilder() });
    },
} satisfies MessageCommand;
