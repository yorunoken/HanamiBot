import { ChatInputCommandInteraction } from "discord.js";
import { start } from "../../Helpers/pp";
import { ExtendedClient, Locales } from "../../Structure/index";

export async function run({ interaction, client, locale }: { interaction: ChatInputCommandInteraction; client: ExtendedClient; locale: Locales }) {
  await interaction.deferReply();
  await start({ interaction, client, locale });
}
export { data } from "../data/pp";
