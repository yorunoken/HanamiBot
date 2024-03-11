import { slashCommandsIds } from "../../utils/cache";
import type { Message } from "@lilybird/transformers";
import type { MessageCommand } from "../../types/commands";

export default {
    name: "link",
    description: "Link your osu! account",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        await message.reply(`This command has been deprecated. Use ${slashCommandsIds.get("link")} instead.`);
    }
} satisfies MessageCommand;

