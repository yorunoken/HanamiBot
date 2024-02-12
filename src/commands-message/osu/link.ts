import { slashCommandsIds } from "../../utils/cache";
import type { MessageCommand } from "../../types/commands";
import type { Message } from "lilybird";

async function run({ message }: { message: Message }): Promise<void> {
    await message.reply(`This command has been deprecated. Use ${slashCommandsIds.get("link")} instead.`);
}

export default {
    name: "link",
    description: "Link your osu! account",
    cooldown: 1000,
    run
} satisfies MessageCommand;
