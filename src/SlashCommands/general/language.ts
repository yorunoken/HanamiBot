import { ChatInputCommandInteraction } from "discord.js";
import fs from "fs";
import { ExtendedClient } from "../../Structure";
import { getServer, insertData } from "../../utils";

export async function run({ interaction, client }: { interaction: ChatInputCommandInteraction; client: ExtendedClient }) {
  await interaction.deferReply();
  if (!interaction.guildId) return;

  const language = interaction.options.getString("language", true).toLowerCase();
  if (!fs.existsSync(`./src/locales/${language}.json`)) {
    interaction.editReply("That language doesn't exist in /locales consider [opening a pull request on github](https://github.com/YoruNoKen/HanamiBot) :)");
    return;
  }

  const guildId = interaction.guildId;
  const guild = getServer(guildId);
  insertData({ table: "servers", data: JSON.stringify({ ...JSON.parse(guild.data), language }), id: guildId });
  client.localeLanguage.set(guildId, language);

  interaction.editReply(`Successfully set language to: \`${language}\``);
}
export { data } from "../data/language";
