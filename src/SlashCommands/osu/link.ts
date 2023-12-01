import { ChatInputCommandInteraction } from "discord.js";
import { start } from "../../Helpers/link";
import { Locales } from "../../Structure";

export async function run({ interaction, locale }: { interaction: ChatInputCommandInteraction; locale: Locales }) {
  await interaction.deferReply();
  await start(interaction, locale);
}
export { data } from "../data/link";
