import type { Message } from "discord.js";

export const name = "ping";
export const aliases = ["ping", "p"];
export const cooldown = 3000;
export const description = "Returns the ping of the bot";

export async function run({ message }: { message: Message }): Promise<void> {
    const timeNow = Date.now();
    const response = await message.reply("Pong! 🏓");
    const ms = Date.now() - timeNow;
    await response.edit(`Pong! 🏓(${ms}ms)`);
}
