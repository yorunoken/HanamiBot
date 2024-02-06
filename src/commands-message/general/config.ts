import type { MessageCommand } from "../../types/commands";
import type { Message } from "lilybird";

export default {
    name: "ping",
    description: "Changes the config files of the user",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        await message.reply("This command has been deprecated. Use /config instead.");
    }
} satisfies MessageCommand;
