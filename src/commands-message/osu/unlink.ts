import { slashCommandsIds } from "@utils/cache";
import type { Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

export default {
    name: "unlink",
    description: "Unlink your account from the bot.",
    usage: "/unlink",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        await message.reply(`This command has been deprecated. Use ${slashCommandsIds.get("unlink")} instead.`);
    },
} satisfies MessageCommand;
