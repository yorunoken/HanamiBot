import { linkSlash } from "../utils/constants";
import type { MessageCommands } from "../types/commands";
import type { Message } from "lilybird";

async function run({ message }: { message: Message }): Promise<void> {
    await message.reply(`This command has been deprecated. Use ${linkSlash} instead.`);
}

export default {
    name: "link",
    description: "Link your osu! account",
    cooldown: 1000,
    run
} satisfies MessageCommands;
