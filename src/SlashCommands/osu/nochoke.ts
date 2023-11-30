import { ChatInputCommandInteraction } from "discord.js";
import { start } from "../../Helpers/nochoke";
import { ExtendedClient } from "../../Structure/index";

export async function run({ interaction, client }: { interaction: ChatInputCommandInteraction; client: ExtendedClient }) {
  await interaction.deferReply();
  await start({ interaction, client });
}
export { data } from "../data/nochoke";
