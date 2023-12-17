import { start } from "../../Helpers/leaderboard";
import { returnFlags } from "../../utils";
import type { ExtendedClient, Locales } from "../../Structure/index";
import type { Message } from "discord.js";

const typeAlises: Record<string, { type: "global" | "country" }> = {
    leaderboard: { type: "global" },
    lb: { type: "global" }
};

export const name = "leaderboard";
export const aliases = Object.keys(typeAlises);
export const cooldown = 3000;
export const description = "Get the leaderboard of a map.\nMods can be specified through +_, +!_, -!_ syntax";
export const flags = returnFlags({ page: true });

export async function run({ message, args, commandName, client, locale }:
{ message: Message, args: Array<string>, commandName: "global" | "country", client: ExtendedClient, locale: Locales }): Promise<void> {
    await message.channel.sendTyping();
    await start({ interaction: message, client, args, type: typeAlises[commandName].type, locale });
}
