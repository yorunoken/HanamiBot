import { Client, Message } from "discord.js";
import { start } from "../../Helpers/leaderboard";
import { returnFlags } from "../../utils";

const typeAlises: { [key: string]: { type: "global" | "country" } } = {
  leaderboard: { type: "global" },
  lb: { type: "global" },

  countryleaderboard: { type: "country" },
  cl: { type: "country" },
  clb: { type: "country" },
  ct: { type: "country" },
};

export const name = "leaderboard";
export const aliases = Object.keys(typeAlises);
export const cooldown = 3000;
export const description = `Get the leaderboard of a map.`;
export const flags = returnFlags({ page: true, mods: true });

export async function run({ message, args, commandName, client }: { message: Message; args: string[]; commandName: "global" | "country"; client: Client }) {
  await message.channel.sendTyping();
  await start({ interaction: message, client, args, type: typeAlises[commandName].type });
}
