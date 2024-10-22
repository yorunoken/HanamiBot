import type { PrefixCommand } from "types/commands/interfaces";
import { applicationCommandsIds } from "utils/load-commands";

export default {
    data: {
        name: "link",
        cooldownMs: 30000,
    },

    info: {
        description: "[DEPRECATED] Links your Discord account to an osu! account, the prefix version of this command was deprecated, so you should use the slash command version.",
        smallDescription: "Links osu! account.",
        category: "osu",
    },

    exec: async ({ message }) => {
        await message.reply({
            content: `This command has been deprecated. Please use the slash command version: ${applicationCommandsIds.get("link")}`,
        });
    },
} satisfies PrefixCommand;
