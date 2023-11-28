import { Message } from "discord.js";
import { start } from "../../Helpers/help";

export const name = "help";
export const aliases = ["help"];
export const cooldown = 3000;
export const description = `Get information of the bot or the commands`;

export async function run({ message, args }: { message: Message; args: string[] }) {
  await start({ interaction: message, args });
}
