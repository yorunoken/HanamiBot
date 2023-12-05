import { ChatInputCommandInteraction } from "discord.js";
import fs from "fs";
import { ExtendedClient, Locales } from "../../Structure";
import { getServer, insertData } from "../../utils";

export async function run({ interaction, client, locale }: { interaction: ChatInputCommandInteraction; client: ExtendedClient; locale: Locales }) {
  await interaction.deferReply();
  if (!interaction.guildId) return;

  const language = interaction.options.getString("language", true).toLowerCase();
  if (!fs.existsSync(`./src/locales/${language}.ts`)) {
    interaction.editReply(locale.fails.languageDoesntExist);
    return;
  }

  const guildId = interaction.guildId;
  const data = JSON.parse(getServer(guildId).data);
  data.language = language;

  insertData({ table: "servers", data: JSON.stringify(data), id: guildId });
  client.localeLanguage.set(guildId, language);

  interaction.editReply(locale.misc.languageSet(`\`${language}\``));
}
export { data } from "../data/language";
