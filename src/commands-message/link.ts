import { linkSlash } from "../utils/constants";
import type { Message } from "lilybird";
import type { MessageCommand } from "@lilybird/handlers";

async function run(message: Message): Promise<void> {
    await message.reply(`This command has been deprecated. Use ${linkSlash} instead.`);
}

export default {
    name: "link",
    run
} satisfies MessageCommand;
