import { getUsernameFromArgs, Interactionhandler, showMoreButton, getBeatmapId_FromContext } from "../utils";
import { Message, ChatInputCommandInteraction, EmbedBuilder, ButtonInteraction, Client } from "discord.js";
import { UserDetails, ButtonActions } from "../classes";
import { osuModes } from "../types";
import { v2 } from "osu-api-extended";

export async function start(interaction: Message, client: Client, args?: string[], mode?: osuModes) {
  const options = Interactionhandler(interaction, args);

  const userOptions = getUsernameFromArgs(options.author, options.userArgs);
  if (!userOptions) {
    return options.reply("Something went wrong.");
  }
  if (userOptions.user?.status === false) {
    return options.reply(userOptions.user.message);
  }

  const beatmapId = await getBeatmapId_FromContext(interaction, client);
  if (!beatmapId) {
    return options.reply(`There doesn't seem to be any beatmap embeds in this conversation.`);
  }
  console.log(beatmapId);

  const user = await v2.user.details(userOptions.user, options.mode);
  if (!user.id) {
    return options.reply(`The user \`${userOptions.user}\` does not exist in Bancho.`);
  }

  const userDetailOptions = new UserDetails(user, options.mode);
}
