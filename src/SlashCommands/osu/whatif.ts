import { ChatInputCommandInteraction } from "discord.js";
import { MyClient } from "../../classes";
import { start } from "../../Helpers/whatif";

export async function run({ interaction, client }: { interaction: ChatInputCommandInteraction; client: MyClient }) {
  await interaction.deferReply();
  await start({ interaction, client });
}
export { data } from "../data/whatif";