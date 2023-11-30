import { ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { v2 } from "osu-api-extended";
import { osuModes } from "../Structure";
import { getUsernameFromArgs, Interactionhandler, showMoreButton } from "../utils";

export async function start({ interaction, mode, args }: { interaction: Message | ChatInputCommandInteraction; mode: osuModes; args?: string[] }) {
  const options = Interactionhandler(interaction, args);

  const userOptions = getUsernameFromArgs(options.author, options.userArgs);
  if (!userOptions) {
    return options.reply("Something went wrong.");
  }
  if (userOptions.user?.status === false) {
    return options.reply(userOptions.user.message);
  }

  const user = await v2.user.details(userOptions.user, options.mode);
  if (!user.id) {
    return options.reply(`The user \`${userOptions.user}\` does not exist in Bancho.`);
  }

  const tops = await v2.scores.user.category(user.id, "best", {
    limit: "100",
    mode,
  });
  if (tops.length === 0) {
    return options.reply(`The user \`${user.username}\` does not have any top plays in Bancho.`);
  }

  // const uDetail = new UserDetails(user, options.mode);
  // const sDetail = new StatsDetails(user, tops);
}
