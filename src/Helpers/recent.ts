import { getUsernameFromArgs, IntearctionHandler, nextButton, previousButton, buildActionRow } from "../utils";
import { UserDetails, ButtonActions, ScoreDetails } from "../classes";
import { Message, ChatInputCommandInteraction, ButtonInteraction, EmbedBuilder } from "discord.js";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { v2 } from "osu-api-extended";
import { osuModes } from "../types";

export async function start(interaction: Message | ChatInputCommandInteraction, passOnly?: boolean, args?: string[], mode?: osuModes, number?: number) {
  const argOptions = IntearctionHandler(interaction, args);
  argOptions.mode = mode ?? argOptions.mode;
  argOptions.passOnly = passOnly ?? argOptions.passOnly;
  const index = number || 0;

  const userOptions = getUsernameFromArgs(argOptions.author, argOptions.userArgs);
  if (!userOptions) {
    return argOptions.reply("Something went wrong.");
  }
  if (userOptions.user?.status === false) {
    return argOptions.reply(userOptions.user.message);
  }

  const user = await v2.user.details(userOptions.user, argOptions.mode);
  if (!user.id) {
    return argOptions.reply(`The user \`${userOptions.user}\` does not exist in Bancho.`);
  }
  const plays = await v2.scores.user.category(user.id, "recent", {
    limit: "50",
    include_fails: !argOptions.passOnly,
    mode: argOptions.mode,
  });
  if (plays.length === 0) {
    return argOptions.reply(`The user \`${userOptions.user}\` does not have recent plays in Bancho.`);
  }

  const userDetailOptions = new UserDetails(user, argOptions.mode);

  const functionOptions = { user: userDetailOptions, plays, mode: argOptions.mode, index };
  const embed = await getRecentPlay(functionOptions);

  const components = [buildActionRow([previousButton, nextButton], [index === 0, index + 1 === plays.length])];
  const response = await argOptions.reply({ embeds: [embed], components });

  const filter = (i: any) => i.user.id === argOptions.author.id;
  const collector = response.createMessageComponentCollector({ time: 60000, filter });

  collector.on("collect", async function (i: ButtonInteraction) {
    await ButtonActions.handleRecentButtons(getRecentPlay, functionOptions, i, response);
  });

  collector.on("end", async () => {
    await response.edit({ components: [] });
  });
}

async function getRecentPlay({ user, plays, mode, index }: { user: UserDetails; plays: ScoreResponse[]; mode: osuModes; index: number }) {
  const options = await new ScoreDetails().initialize(plays, index, mode);

  return new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: `${user.username} ${user.pp}pp (#${user.globalRank} ${user.countryCode}#${user.countryRank})`,
      // iconURL: `https://osu.ppy.sh/images/flags/${countryCode}.png`,
      iconURL: user.userAvatar,
      url: user.userUrl,
    })
    .setTitle(`${options.artist} - ${options.title} [${options.version}] [${options.stars}★]`)
    .setURL(`https://osu.ppy.sh/b/${options.beatmapId}`)
    .setFields({
      name: `${options.grade} ${options.percentagePassed}${options.modsPlay}  **${options.totalScore}  ${options.accuracy}** <t:${options.submittedTime}:R>`,
      value: `${options.ppValue}\n${options.ifFcValue} Try #${options.retries}\n\nBPM: \`${options.bpm}\` Length: \`${options.minutesTotal}:${options.secondsTotal}\`\n\`${options.mapValues}\``,
    })
    .setThumbnail(`https://assets.ppy.sh/beatmaps/${options.mapsetId}/covers/list.jpg`)
    .setFooter({ text: `by ${options.creatorUsername}, ${options.mapStatus}`, iconURL: `https://a.ppy.sh/${options.creatorId}?1668890819.jpeg` });
}
