import { ChatInputCommandInteraction, EmbedBuilder, Message, User } from "discord.js";
import { insertData, getUser, Interactionhandler, getUsernameFromArgs } from "../utils";
import { v2 } from "osu-api-extended";

export async function start(interaction: ChatInputCommandInteraction | Message, args?: string[]) {
  const options = Interactionhandler(interaction, args);
  const { reply } = options;

  const username = options.userArgs;
  if (username.length === 0) {
    return reply("Please provide a username");
  }

  const userOptions = getUsernameFromArgs({} as User, username);
  if (userOptions?.user.status === false) {
    return reply('Something went wrong, try wrapping the username in quotes (")');
  }

  const author = options.author;
  const user = await v2.user.details(userOptions?.user, "osu");
  if (!user.id) {
    return options.reply(`The user \`${userOptions?.user}\` does not exist in Bancho.`);
  }

  let currentDocs = await getUser(author.id);
  if (!currentDocs) {
    currentDocs = {};
    currentDocs.data = JSON.stringify({ banchoId: user.id });
    insertData({ table: "users", id: author.id, data: currentDocs.data });
  }
  let data = JSON.parse(currentDocs.data);
  data.banchoId = user.id;

  insertData({ table: "users", id: author.id, data: JSON.stringify(data) });

  const embed = new EmbedBuilder().setColor("Green").setTitle(`Success!`).setDescription(`Successfully linked your Discord account (<@${author.id}>) to osu! user ${user.username}`).setThumbnail(user.avatar_url);
  await reply({ embeds: [embed] });
}
