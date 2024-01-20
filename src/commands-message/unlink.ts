import type { Message } from "lilybird";
import type { MessageCommand } from "@lilybird/handlers";

async function run(message: Message): Promise<void> {
    await message.reply("This command has been deprecated. Use `/unlink` instead.");
}

export default {
    name: "unlink",
    run
} satisfies MessageCommand;
