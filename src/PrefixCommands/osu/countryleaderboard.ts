import { Message } from "discord.js";
import { start } from "../../Helpers/leaderboard";
import { ExtendedClient, Locales } from "../../Structure/index";
import { returnFlags } from "../../utils";

const typeAlises: { [key: string]: { type: "global" | "country" } } = {
  countryleaderboard: { type: "country" },
  cl: { type: "country" },
  clb: { type: "country" },
  ct: { type: "country" },
};

export const name = "ct";
export const aliases = Object.keys(typeAlises);
export const cooldown = 3000;
export const description = `Get the leaderboard of a map.\nMods can be specified through +_, +!_, -!_ syntax`;
export const flags = returnFlags({ page: true });

export async function run({ message, args, commandName, client, locale }: { message: Message; args: string[]; commandName: "global" | "country"; client: ExtendedClient; locale: Locales }) {
  await message.channel.sendTyping();
  await start({ interaction: message, client, args, type: typeAlises[commandName].type, locale });
}
