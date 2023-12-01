import { Client, Message } from "discord.js";
import { start } from "../../Helpers/compare";
import { Locales, osuModes } from "../../Structure";

const modeAliases: { [key: string]: { mode: osuModes | string } } = {
  compare: { mode: "" },
  c: { mode: "" },

  compareosu: { mode: "osu" },
  co: { mode: "osu" },
  comparetaiko: { mode: "taiko" },
  cmt: { mode: "taiko" },
  comparemania: { mode: "mania" },
  cmm: { mode: "mania" },
  comparecatch: { mode: "fruits" },
  comparefruits: { mode: "fruits" },
  cmc: { mode: "fruits" },
  cmf: { mode: "fruits" },
};

export const name = "compare";
export const aliases = Object.keys(modeAliases);
export const cooldown = 3000;
export const description = `Get the plays of an osu! player on a specific map.\nMods can be specified through +_, +!_, -!_ syntax`;

export async function run({ message, args, commandName, client, locale }: { message: Message; args: string[]; commandName: osuModes; client: Client; locale: Locales }) {
  await message.channel.sendTyping();
  const modeOptions = modeAliases[commandName].mode;

  await start({ interaction: message, client, args, mode: modeOptions, locale });
}
