import { Message } from "discord.js";
import { start } from "../../Helpers/prefix";

export const name = "prefix";
export const aliases = ["prefix"];
export const cooldown = 3000;
export const description = `Change, remove, or view a list of prefixes`;

export async function run({ message, args }: { message: Message; args: string[] }) {
  // await start({ interaction: message, args });
}
