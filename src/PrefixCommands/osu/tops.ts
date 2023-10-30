import { Message } from "discord.js";
import { start } from "../../Helpers/plays";
import { osuModes } from "../../types";

const modeAliases: { [key: string]: { mode: osuModes; recent: boolean } } = {
  top: { mode: "osu", recent: false },
  topt: { mode: "taiko", recent: false },
  topm: { mode: "mania", recent: false },
  topc: { mode: "fruits", recent: false },
  toptaiko: { mode: "taiko", recent: false },
  topmania: { mode: "mania", recent: false },
  topcatch: { mode: "fruits", recent: false },

  rb: { mode: "osu", recent: true },
  rbt: { mode: "taiko", recent: true },
  rbm: { mode: "mania", recent: true },
  rbc: { mode: "fruits", recent: true },
  recentbest: { mode: "osu", recent: true },
  recentbesttaiko: { mode: "taiko", recent: true },
  recentbestmania: { mode: "mania", recent: true },
  recentbestcatch: { mode: "fruits", recent: true },
};

export const name = "top";
export const aliases = Object.keys(modeAliases);
export const cooldown = 3000;

export async function run({ message, args, commandName, index }: { message: Message; args: string[]; commandName: string; index: number }) {
  await message.channel.sendTyping();

  const alias = modeAliases[commandName.toLowerCase()];
  const modeOptions = alias.mode || undefined;
  const isRecent = alias.recent || false;
  const isTops = true;

  await start({ isTops, interaction: message, isRecent, args, mode: modeOptions, number: index - 1 });
}
