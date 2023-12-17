import { start } from "../../Helpers/link";
import type { Locales } from "../../Structure";
import type { Message } from "discord.js";

export const name = "link";
export const aliases = ["link"];
export const cooldown = 3000;
export const description = "Link your osu! account to your Discord account.";

export async function run({ message, args, locale }: { message: Message, args: Array<string>, locale: Locales }): Promise<void> {
    await message.channel.sendTyping();
    await start(message, locale, args);
}
