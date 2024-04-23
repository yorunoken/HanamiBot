import { commandBuilder } from "@builders/simple/command";
import type { MessageCommand } from "@type/commands";

export default {
    name: "command",
    description: "Get info about commands.",
    details: "use `name: commandname` to gain information on a specific command.",
    usage: "/command",
    cooldown: 1000,
    run: async ({ message, args }) => {
        await message.reply({ embeds: commandBuilder(args[0]) });
    }
} satisfies MessageCommand;
