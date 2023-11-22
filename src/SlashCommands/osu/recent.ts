import { ChatInputCommandInteraction } from "discord.js";
import { start } from "../../Helpers/plays";
import { MyClient } from "../../classes";

export async function run({ interaction, client }: { interaction: ChatInputCommandInteraction; client: MyClient }) {
  await interaction.deferReply();
  await start({ isTops: false, interaction, client });
}
export { data } from "../data/recent";
