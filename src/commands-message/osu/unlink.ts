import { slashCommandsIds } from "../../utils/cache";
import type { MessageCommand } from "../../types/commands";

export default {
    name: "unlink",
    description: "Unlink your account from the bot.",
    cooldown: 1000,
    run: async ({ message }) => {
        await message.reply(`This command has been deprecated. Use ${slashCommandsIds.get("unlink")} instead.`);
    }
} satisfies MessageCommand;
