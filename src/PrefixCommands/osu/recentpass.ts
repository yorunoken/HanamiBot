import { start } from "../../Helpers/plays";
import { returnFlags } from "../../utils";
import type { Locales, osuModes, ExtendedClient } from "../../Structure";
import type { Message } from "discord.js";

const modeAliases: Record<string, { mode: osuModes, passOnly: boolean } | undefined> = {
    rp: { mode: "osu", passOnly: true },
    rsp: { mode: "osu", passOnly: true },
    rpt: { mode: "taiko", passOnly: true },
    rpm: { mode: "mania", passOnly: true },
    rpc: { mode: "fruits", passOnly: true },
    recentpass: { mode: "osu", passOnly: true },
    recentpasstaiko: { mode: "taiko", passOnly: true },
    recentpassmania: { mode: "mania", passOnly: true },
    recentpasscatch: { mode: "fruits", passOnly: true }
};

export const name = "recentpass";
export const aliases = Object.keys(modeAliases);
export const cooldown = 3000;
export const description = "Get the recent passed play of an osu! player.\nMods can be specified through +_, +!_, -!_ syntax";
export const flags = returnFlags({ index: true });

export async function run({ message, args, commandName, index, client, locale }:
{ message: Message, args: Array<string>, commandName: string, index: number, client: ExtendedClient, locale: Locales }): Promise<void> {
    await message.channel.sendTyping();

    const alias = modeAliases[commandName.toLowerCase()];
    const modeOptions = alias?.mode ?? undefined;
    const passOnly = alias?.passOnly ?? false;
    const isTops = false;

    await start({ isTops, interaction: message, passOnly, args, mode: modeOptions, number: index - 1, client, locale });
}
