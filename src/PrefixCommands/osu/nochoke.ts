import { start } from "../../Helpers/nochoke";
import { returnFlags } from "../../utils";
import type { Locales, osuModes, ExtendedClient } from "../../Structure";
import type { Message } from "discord.js";

const modeAliases: Record<string, { mode: osuModes } | undefined> = {
    nochoke: { mode: "osu" },
    nochoketaiko: { mode: "taiko" },
    nochokemania: { mode: "mania" },
    nochokecatch: { mode: "fruits" },

    nc: { mode: "osu" },
    nct: { mode: "taiko" },
    ncm: { mode: "mania" },
    ncn: { mode: "fruits" }
};

export const name = "nochoke";
export const aliases = Object.keys(modeAliases);
export const cooldown = 3000;
export const description = "Get the top plays of an osu! player.\nMods can be specified through `+_, +!_, -!_` syntax";
export const flags = returnFlags({ index: true, page: true });

export async function run({ message, args, commandName, client, locale }:
{ message: Message, args: Array<string>, commandName: string, client: ExtendedClient, locale: Locales }): Promise<void> {
    await message.channel.sendTyping();

    const alias = modeAliases[commandName.toLowerCase()];
    const mode = alias?.mode ?? undefined;

    await start({ interaction: message, args, mode, client, locale });
}
