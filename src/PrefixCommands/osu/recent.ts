import { Message } from "discord.js";
import { start } from "../../Helpers/recent";
import { osuModes } from "../../types";

const modeAliases: { [key: string]: { mode: osuModes; passOnly: boolean } } = {
  // recents
  r: { mode: "osu", passOnly: false },
  rs: { mode: "osu", passOnly: false },
  rt: { mode: "taiko", passOnly: false },
  rm: { mode: "mania", passOnly: false },
  rc: { mode: "fruits", passOnly: false },
  recent: { mode: "osu", passOnly: false },
  recenttaiko: { mode: "taiko", passOnly: false },
  recentmania: { mode: "mania", passOnly: false },
  recentcatch: { mode: "fruits", passOnly: false },

  rp: { mode: "osu", passOnly: true },
  rsp: { mode: "osu", passOnly: true },
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

export async function run({ message, args, commandName, index }: { message: Message; args: string[]; commandName: string; index: number }) {
  await message.channel.sendTyping();

  const alias = modeAliases[commandName.toLowerCase()];
  const modeOptions = alias.mode || undefined;
  const passOnly = alias.passOnly || false;
  const isRecent = true;
  console.log(index);

  await start(isRecent, message, passOnly, args, modeOptions, index - 1);
}
