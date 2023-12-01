import { Message } from "discord.js";
import { start } from "../../Helpers/osu";
import { Locales, osuModes } from "../../Structure";
import { ExtendedClient } from "../../Structure/index";

export const name = "osu";
export const aliases = ["osu", "mania", "taiko", "catch"];
export const cooldown = 3000;
export const description = `Get information of an osu! player.`;

export async function run({ message, args, commandName, client, locale }: { message: Message; args: string[]; commandName: osuModes; client: ExtendedClient; locale: Locales }) {
  await message.channel.sendTyping();
  await start(message, client, locale, args, commandName);
}
