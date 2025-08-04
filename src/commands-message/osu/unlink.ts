import type { Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";
import { slashCommandIdsCache } from "@utils/redis";

export default {
    name: "unlink",
    description: "Unlink your account from the bot.",
    usage: "/unlink",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        const unlinkCommandId = slashCommandIdsCache.get("unlink");
        const commandMention = unlinkCommandId ?? "/unlink";
        await message.reply(`This command has been deprecated. Use ${commandMention} instead.`);
    },
} satisfies MessageCommand;
