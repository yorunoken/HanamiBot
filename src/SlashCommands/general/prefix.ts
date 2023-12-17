import { start } from "../../Helpers/prefix";
import type { Locales } from "../../Structure";
import type { ChatInputCommandInteraction } from "discord.js";

export async function run({ interaction, locale }: { interaction: ChatInputCommandInteraction, locale: Locales }): Promise<void> {
    await interaction.deferReply();
    await start({ interaction, locale });
}
export { data } from "../data/prefix";
