import { start } from "../../Helpers/plays";
import type { ExtendedClient, Locales } from "../../Structure/index";
import type { ChatInputCommandInteraction } from "discord.js";

export async function run({ interaction, client, locale }: { interaction: ChatInputCommandInteraction, client: ExtendedClient, locale: Locales }) {
    await interaction.deferReply();
    await start({ isTops: false, interaction, client, locale });
}
export { data } from "../data/recent";
