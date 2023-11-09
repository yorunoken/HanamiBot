import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { insertData, getUser } from "../utils";
import { v2 } from "osu-api-extended";

export async function start(interaction: ChatInputCommandInteraction) {
  const username = interaction.options.getString("user")!;
  const author = interaction.user;

  const user = await v2.user.details(username, "osu");
  if (!user.id) {
    return interaction.reply(`The user \`${username}\` does not exist in Bancho.`);
  }

  let currentDocs = await getUser(author.id);
  if (!currentDocs) {
    currentDocs = {};
    currentDocs.data = JSON.stringify({ banchoId: user.id });
    await insertData({ table: "users", id: author.id, data: currentDocs.data });
  }
  let data = JSON.parse(currentDocs.data);
  if (data.banchoId === user.id) {
    const embed = new EmbedBuilder().setColor("Red").setTitle(`Error!`).setDescription(`It seems you are already linked to this account.`).setThumbnail(user.avatar_url);
    return await interaction.editReply({ embeds: [embed] });
  }
  data.banchoId = user.id;

  await insertData({ table: "users", id: author.id, data: JSON.stringify(data) });

  const embed = new EmbedBuilder().setColor("Green").setTitle(`Success!`).setDescription(`Successfully linked your Discord account (<@${author.id}>) to osu! user ${user.username}`).setThumbnail(user.avatar_url);
  await interaction.editReply({ embeds: [embed] });
}
