import { ChatInputCommandInteraction } from "discord.js";
import { start } from "../../Helpers/plays";
import { ExtendedClient } from "../../Structure/index";

export async function run({ interaction, client }: { interaction: ChatInputCommandInteraction; client: ExtendedClient }) {
  await interaction.deferReply();
  await start({ isTops: true, interaction, client });
}
export { data } from "../data/tops";
