import { Message } from "discord.js";
import { start } from "../../Helpers/osu";

export const name = "osu";
export const aliases = ["osu"];
export const cooldown = 3000;

export async function run({ message, args }: { message: Message; args: string[] }) {
  await message.channel.sendTyping();

  await start(message, args);
}
