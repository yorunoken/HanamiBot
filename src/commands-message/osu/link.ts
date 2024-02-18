import { slashCommandsIds } from "../../utils/cache";
import type { MessageCommand } from "../../types/commands";

export default {
    name: "link",
    description: "Link your osu! account",
    cooldown: 1000,
    run: async ({ message }) => {
        await message.reply(`This command has been deprecated. Use ${slashCommandsIds.get("link")} instead.`);
    }
} satisfies MessageCommand;

