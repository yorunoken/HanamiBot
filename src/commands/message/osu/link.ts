import type { Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";
import { slashCommandIdsCache } from "@utils/cache";

export default {
    name: "link",
    description: "Link your osu! account",
    usage: "/link",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        const linkCommandId = slashCommandIdsCache.get("link");
        const commandMention = linkCommandId ?? "/link";
        await message.reply(`This command has been deprecated. Use ${commandMention} instead.`);
    },
} satisfies MessageCommand;
