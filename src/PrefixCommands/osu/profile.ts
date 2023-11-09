import { Message } from "discord.js";
import { start } from "../../Helpers/osu";
import { osuModes } from "../../types";

export const name = "osu";
export const aliases = ["osu", "mania", "taiko", "catch"];
export const cooldown = 3000;

export async function run({ message, args, commandName }: { message: Message; args: string[]; commandName: osuModes }) {
  await message.channel.sendTyping();
  await start(message, args, commandName);
}
