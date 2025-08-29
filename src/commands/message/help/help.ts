import { helpBuilder } from "@builders";
import type { MessageCommand } from "@type/commands";

export default {
    name: "help",
    description: "Get help about the bot or specific commands.",
    usage: "/help [command_name]",
    cooldown: 1000,
    run: async ({ message, args }) => {
        await message.reply({ embeds: helpBuilder(args[0]) });
    },
} satisfies MessageCommand;
