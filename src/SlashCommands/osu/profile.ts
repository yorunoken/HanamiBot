import { ChatInputCommandInteraction } from "discord.js";
import { v2 } from "osu-api-extended";

export async function run({ interaction }: { interaction: ChatInputCommandInteraction }) {
  await interaction.deferReply();
}
export { data } from "../data/profile";
