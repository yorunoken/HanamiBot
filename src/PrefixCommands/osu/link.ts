import { Message } from "discord.js";
import { start } from "../../Helpers/link";
import { Locales } from "../../Structure";

export const name = "link";
export const aliases = ["link"];
export const cooldown = 3000;
export const description = `Link your osu! account to your Discord account.`;

export async function run({ message, args, locale }: { message: Message; args: string[]; locale: Locales }) {
  await message.channel.sendTyping();
  await start(message, locale, args);
}
