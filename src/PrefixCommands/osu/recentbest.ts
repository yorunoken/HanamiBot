import { Message } from "discord.js";
import { start } from "../../Helpers/plays";
import { Locales, osuModes } from "../../Structure";
import { ExtendedClient } from "../../Structure/index";
import { returnFlags } from "../../utils";

const modeAliases: { [key: string]: { mode: osuModes; recent: boolean } } = {
  rb: { mode: "osu", recent: true },
  rbt: { mode: "taiko", recent: true },
  rbm: { mode: "mania", recent: true },
  rbc: { mode: "fruits", recent: true },
  recentbest: { mode: "osu", recent: true },
  recentbesttaiko: { mode: "taiko", recent: true },
  recentbestmania: { mode: "mania", recent: true },
  recentbestcatch: { mode: "fruits", recent: true },
};

export const name = "recentbest";
export const aliases = Object.keys(modeAliases);
export const cooldown = 3000;
export const description = `Get the top plays of an osu! player.\nMods can be specified through \`+_, +!_, -!_\` syntax`;
export const flags = returnFlags({ index: true, page: true });

export async function run({ message, args, commandName, index, client, locale }: { message: Message; args: string[]; commandName: string; index: number; client: ExtendedClient; locale: Locales }) {
  await message.channel.sendTyping();

  const alias = modeAliases[commandName.toLowerCase()];
  const modeOptions = alias.mode || undefined;
  const recentTop = alias.recent || false;
  const isTops = true;

  await start({ isTops, interaction: message, recentTop, args, mode: modeOptions, number: index - 1, client, locale });
}
