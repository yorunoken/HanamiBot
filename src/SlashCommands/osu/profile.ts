import { ChatInputCommandInteraction } from "discord.js";
import { start } from "../../Helpers/osu";
import { MyClient } from "../../classes";

export async function run({ interaction, client }: { interaction: ChatInputCommandInteraction; client: MyClient }) {
  await interaction.deferReply();
  await start(interaction, client);
}
export { data } from "../data/profile";
