import { start } from "../../Helpers/map";
import type { Locales } from "../../Structure";
import type { Client, Message } from "discord.js";

export const name = "map";
export const aliases = ["map", "m"];
export const cooldown = 3000;
export const description = "Get information of a map.\nMods can be specified through +_, +!_, -!_ syntax";

export async function run({ message, args, client, locale }: { message: Message, args: Array<string>, client: Client, locale: Locales }): Promise<void> {
    await message.channel.sendTyping();
    await start({ interaction: message, client, args, locale });
}
