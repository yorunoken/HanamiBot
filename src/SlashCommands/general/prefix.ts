import { ChatInputCommandInteraction } from "discord.js";
import { start } from "../../Helpers/prefix";

export async function run({ interaction }: { interaction: ChatInputCommandInteraction }) {
  await interaction.deferReply();
  await start({ interaction });
}
export { data } from "../data/prefix";
