import { start } from "../../Helpers/help";
import type { Locales } from "../../Structure";
import type { Message } from "discord.js";

export const name = "help";
export const aliases = ["help"];
export const cooldown = 3000;
export const description = "Get information of the bot or the commands";

export async function run({ message, args, locale }: { message: Message, args: Array<string>, locale: Locales }): Promise<void> {
    await start({ interaction: message, args, locale });
}
