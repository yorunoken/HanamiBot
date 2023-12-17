import { start } from "../../Helpers/osu";
import type { Locales, osuModes, ExtendedClient } from "../../Structure";
import type { Message } from "discord.js";

export const name = "osu";
export const aliases = ["osu", "mania", "taiko", "catch"];
export const cooldown = 3000;
export const description = "Get information of an osu! player.";

export async function run({ message, args, commandName, client, locale }:
{ message: Message, args: Array<string>, commandName: osuModes, client: ExtendedClient, locale: Locales }): Promise<void> {
    await message.channel.sendTyping();
    await start(message, client, locale, args, commandName);
}
