import type { MessageCommand } from "@type/commands";
import { slashCommandIdsCache } from "@utils/cache";

export default {
    name: "prefix",
    description: "Changes/removes/lists the prefixes in your server",
    details: `add: Add a prefix to your server. (max 10)
    remove: Removes a prefix from your server.
    list: Lists the currently set prefixes in your server.`,
    usage: `/prefix add: >
    /prefix list`,
    cooldown: 1000,
    run: async ({ message }) => {
        const prefixCommandId = slashCommandIdsCache.get("prefix");
        const commandMention = prefixCommandId ?? "/prefix";
        await message.reply(`This command has been deprecated. Use ${commandMention} instead.`);
    },
} satisfies MessageCommand;
