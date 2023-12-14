import { ChatInputCommandInteraction, EmbedBuilder, Message, User } from "discord.js";
import { v2 } from "osu-api-extended";
import { Locales } from "../Structure/index";
import { getUser, getUsernameFromArgs, insertData, interactionhandler } from "../utils";

export async function start(interaction: ChatInputCommandInteraction | Message, locale: Locales, args?: string[]) {
  const options = interactionhandler(interaction, args);
  const { reply } = options;

  const username = options.userArgs;
  if (username.length === 0) {
    return reply(locale.embeds.provideUsername);
  }

  const userOptions = getUsernameFromArgs({} as User, username);
  if (userOptions?.user.status === false) {
    return reply(locale.fails.linkFail);
  }

  const author = options.author;
  const user = await v2.user.details(userOptions?.user, "osu");
  if (!user.id) {
    return options.reply(locale.fails.userDoesntExist(userOptions?.user));
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

  const embed = new EmbedBuilder().setColor("Green").setTitle(locale.misc.success).setDescription(locale.embeds.link.success(author.id, user.username)).setThumbnail(user.avatar_url);
  await reply({ embeds: [embed] });
}
