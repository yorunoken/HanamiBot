import { Client, Message } from "discord.js";
import { start } from "../../Helpers/compare";
import { osuModes } from "../../types";

const modeAliases: { [key: string]: { mode: osuModes } } = {
  compare: { mode: "osu" },
  c: { mode: "osu" },
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

export async function run({ message, args, commandName, client }: { message: Message; args: string[]; commandName: osuModes; client: Client }) {
  await message.channel.sendTyping();
  await start(message, client, args, commandName);
}
