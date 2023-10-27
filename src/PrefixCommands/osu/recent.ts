import { Message } from "discord.js";
import { start } from "../../Helpers/recent";
import { osuModes } from "../../types";

const modeAliases: { [key: string]: { mode: osuModes; passOnly: boolean } } = {
  rs: { mode: "osu", passOnly: false },
  rt: { mode: "taiko", passOnly: false },
  rm: { mode: "mania", passOnly: false },
  rc: { mode: "fruits", passOnly: false },
  recent: { mode: "osu", passOnly: false },
  recenttaiko: { mode: "taiko", passOnly: false },
  recentmania: { mode: "mania", passOnly: false },
  recentcatch: { mode: "fruits", passOnly: false },

  // pass only
  rp: { mode: "osu", passOnly: true },
  rpt: { mode: "taiko", passOnly: true },
  rpm: { mode: "mania", passOnly: true },
  rpc: { mode: "fruits", passOnly: true },
  recentpass: { mode: "osu", passOnly: true },
  recentpasstaiko: { mode: "taiko", passOnly: true },
  recentpassmania: { mode: "mania", passOnly: true },
  recentpasscatch: { mode: "fruits", passOnly: true },
};

export const name = "recent";
export const aliases = Object.keys(modeAliases);
export const cooldown = 3000;

export async function run({ message, args, commandName, number }: { message: Message; args: string[]; commandName: string; number: number }) {
  await message.channel.sendTyping();

  const alias = modeAliases[commandName.toLowerCase()];
  const modeOptions = alias.mode || undefined;
  const passOnly = alias.passOnly || false;

  await start(message, passOnly, args, modeOptions, number);
}
