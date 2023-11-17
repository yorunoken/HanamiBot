import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { insertData, getUser, Interactionhandler } from "../utils";
import { v2 } from "osu-api-extended";

export async function start(interaction: ChatInputCommandInteraction | Message, args?: string[]) {
  const options = Interactionhandler(interaction, args)
  const username = options.userArgs?.join("")!;
  const author = options.author;

  const user = await v2.user.details(username, "osu");
  if (!user.id) {
    return options.reply(`The user \`${username}\` does not exist in Bancho.`);
  }

  let currentDocs = await getUser(author.id);
  if (!currentDocs) {
    currentDocs = {};
    currentDocs.data = JSON.stringify({ banchoId: user.id });
    await insertData({ table: "users", id: author.id, data: currentDocs.data });
  }
  let data = JSON.parse(currentDocs.data);
  data.banchoId = user.id;

  await insertData({ table: "users", id: author.id, data: JSON.stringify(data) });

  const embed = new EmbedBuilder().setColor("Green").setTitle(`Success!`).setDescription(`Successfully linked your Discord account (<@${author.id}>) to osu! user ${user.username}`).setThumbnail(user.avatar_url);
  await options.reply({ embeds: [embed] });
}
