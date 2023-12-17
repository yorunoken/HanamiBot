import { start } from "../../Helpers/compare";
import type { Locales, osuModes } from "../../Structure";
import type { Client, Message } from "discord.js";

const modeAliases: Record<string, { mode: osuModes | "" }> = {
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
    cmf: { mode: "fruits" }
};

export const name = "compare";
export const aliases = Object.keys(modeAliases);
export const cooldown = 3000;
export const description = "Get the plays of an osu! player on a specific map.\nMods can be specified through +_, +!_, -!_ syntax";

export async function run({ message, args, commandName, client, locale }: { message: Message, args: Array<string>, commandName: osuModes, client: Client, locale: Locales }): Promise<void> {
    await message.channel.sendTyping();
    const modeOptions = modeAliases[commandName].mode;

    await start({ interaction: message, client, args, mode: modeOptions, locale });
}
