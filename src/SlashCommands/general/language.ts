import { insertData } from "../../utils";
import fs from "fs";
import type { ChatInputCommandInteraction } from "discord.js";
import type { ExtendedClient, Locales } from "../../Structure";

export async function run({ interaction, client, locale }: { interaction: ChatInputCommandInteraction, client: ExtendedClient, locale: Locales }): Promise<void> {
    await interaction.deferReply();
    if (!interaction.guildId) return;

    const language = interaction.options.getString("language", true).toLowerCase();
    if (!fs.existsSync(`./src/locales/${language}.ts`)) {
        await interaction.editReply(locale.fails.languageDoesntExist);
        return;
    }

    const { guildId } = interaction;

    insertData({ table: "servers", data: [ { name: "language", value: language } ], id: guildId });
    client.localeLanguage.set(guildId, language);

    await interaction.editReply(locale.misc.languageSet(`\`${language}\``));
}
export { data } from "../data/language";
