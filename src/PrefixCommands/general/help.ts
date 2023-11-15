import { start } from "../../Helpers/help";
import { Message } from "discord.js";

export const name = "help";
export const aliases = ["help"];
export const cooldown = 3000;
export const description = `Get information of the bot or the commands`;
export const category = "general"

export async function run({ message, args }: { message: Message; args: string[] }) {
  await start({ interaction: message, args });
}
