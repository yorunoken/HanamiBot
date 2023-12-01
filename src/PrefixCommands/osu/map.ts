import { Client, Message } from "discord.js";
import { start } from "../../Helpers/map";
import { Locales } from "../../Structure";

export const name = "map";
export const aliases = ["map", "m"];
export const cooldown = 3000;
export const description = `Get information of a map.\nMods can be specified through +_, +!_, -!_ syntax`;

export async function run({ message, args, client, locale }: { message: Message; args: string[]; client: Client; locale: Locales }) {
  await message.channel.sendTyping();
  await start({ interaction: message, client, args, locale });
}
