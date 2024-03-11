import { slashCommandsIds } from "../../utils/cache";
import type { MessageCommand } from "../../types/commands";
import type { Message } from "@lilybird/transformers";

export default {
    name: "prefix",
    description: "pong!!",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        await message.reply(`This command has been deprecated. Use ${slashCommandsIds.get("prefix")} instead.`);
    }
} satisfies MessageCommand;
