import { ChatInputCommandInteraction } from "discord.js";
import { insertData, getUser } from "../utils";
import { v2 } from "osu-api-extended";

export async function start(interaction: ChatInputCommandInteraction) {
  const username = interaction.options.getString("user")!;
  const author = interaction.user;

  const user = await v2.user.details(username);
  if (!user.id) {
    return interaction.reply(`The user \`${username}\` does not exist in Bancho.`);
  }

  const currentDocs = await getUser(author.id);
}
