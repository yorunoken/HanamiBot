import { ChatInputCommandInteraction } from "discord.js";
import { start } from "../../Helpers/plays";

export async function run({ interaction }: { interaction: ChatInputCommandInteraction }) {
  await interaction.deferReply();
  await start({ isTops: true, interaction });
}
export { data } from "../data/tops";
