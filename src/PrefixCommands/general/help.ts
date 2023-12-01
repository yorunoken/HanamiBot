import { Message } from "discord.js";
import { start } from "../../Helpers/help";
import { Locales } from "../../Structure";

export const name = "help";
export const aliases = ["help"];
export const cooldown = 3000;
export const description = `Get information of the bot or the commands`;

export async function run({ message, args, locale }: { message: Message; args: string[]; locale: Locales }) {
  await start({ interaction: message, args, locale });
}
