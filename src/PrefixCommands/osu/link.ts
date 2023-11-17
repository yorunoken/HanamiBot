import { Message } from "discord.js";
import { start } from "../../Helpers/link";

export const name = "link";
export const aliases = ["link"];
export const cooldown = 3000;
export const description = `Link your osu! account to your Discord account.`;

export async function run({ message, args }: { message: Message; args: string[] }) {
  await message.channel.sendTyping();
  await start(message, args);
}
