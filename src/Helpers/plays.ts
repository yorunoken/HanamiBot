import { getUsernameFromArgs, IntearctionHandler, nextButton, previousButton, buildActionRow, errMsg } from "../utils";
import { UserDetails, ButtonActions, ScoreDetails } from "../classes";
import { Message, ChatInputCommandInteraction, ButtonInteraction, EmbedBuilder } from "discord.js";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { v2 } from "osu-api-extended";
import { osuModes } from "../types";

export async function start({ isTops, interaction, passOnly, args, mode, number, isRecent }: { isTops: boolean; interaction: Message | ChatInputCommandInteraction; passOnly?: boolean; args?: string[]; mode?: osuModes; number?: number; isRecent?: boolean }) {
  const argOptions = IntearctionHandler(interaction, args);
  argOptions.mode = mode ?? argOptions.mode;
  argOptions.passOnly = passOnly ?? argOptions.passOnly;
  const index = number || isTops ? undefined : 0;

  const userOptions = getUsernameFromArgs(argOptions.author, argOptions.userArgs);
  if (!userOptions) {
    return argOptions.reply("Something went wrong.");
  }
  if (userOptions.user?.status === false) {
    return argOptions.reply(userOptions.user.message);
  }
  console.log(userOptions);
  const flags = userOptions.flags;
  const page = isTops ? parseInt((flags.p as string) || (flags.page as string)) || 0 : undefined;

  const user = await v2.user.details(userOptions.user, argOptions.mode);
  if (!user.id) {
    return argOptions.reply(`The user \`${userOptions.user}\` does not exist in Bancho.`);
  }
  const plays = await v2.scores.user.category(user.id, isTops ? "best" : "recent", {
    limit: isTops ? "100" : "50",
    include_fails: !argOptions.passOnly,
    mode: argOptions.mode,
  });
  if (plays.length === 0) {
    return argOptions.reply(`The user \`${userOptions.user}\` does not have recent plays in Bancho.`);
  }

  const userDetailOptions = new UserDetails(user, argOptions.mode);

  const recentOptions = { user: userDetailOptions, plays, mode: argOptions.mode, index, isTops };
  const topsOptions = { user: userDetailOptions, plays, mode: argOptions.mode, page, index, isTops };
  const embed = isTops ? await getSubsequentPlays(topsOptions) : await getRecentPlays(recentOptions);

  const components = [buildActionRow([previousButton, nextButton], [isTops ? page! * 5 === 0 : index === 0, isTops ? page! * 5 + 5 === plays.length : index! + 1 === plays.length])];
  const response = await argOptions.reply({ embeds: [embed], components });

  const filter = (i: any) => i.user.id === argOptions.author.id;
  const collector = response.createMessageComponentCollector({ time: 60000, filter });

  collector.on("collect", async function (i: ButtonInteraction) {
    await ButtonActions[isTops ? "handleTopsButtons" : "handleRecentButtons"]({ pageBuilder: isTops ? getSubsequentPlays : getRecentPlays, options: isTops ? topsOptions : recentOptions, i: i as any, response });
  });

  collector.on("end", async () => {
    await response.edit({ components: [] });
  });
}

async function getRecentPlays({ user, plays, mode, index, isTops }: { user: UserDetails; plays: ScoreResponse[]; mode: osuModes; index: number | undefined; isTops: boolean }) {
  const options = await new ScoreDetails().initialize(plays, index!, mode, isTops);

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
      value: `${options.totalResult}\n${options.ifFcValue} Try #${options.retries}\n\nBPM: \`${options.bpm}\` Length: \`${options.minutesTotal}:${options.secondsTotal}\`\n\`${options.mapValues}\``,
    })
    .setThumbnail(`https://assets.ppy.sh/beatmaps/${options.mapsetId}/covers/list.jpg`)
    .setFooter({ text: `by ${options.creatorUsername}, ${options.mapStatus}`, iconURL: `https://a.ppy.sh/${options.creatorId}?1668890819.jpeg` });
}

async function getSubsequentPlays({ user, plays, mode, page, index, isTops }: { user: UserDetails; plays: ScoreResponse[]; mode: osuModes; page: number | undefined; index: number | undefined; isTops: boolean }) {
  if (index && !page) {
    const options = await new ScoreDetails().initialize(plays, index, mode, isTops);

    let description = [];
    const textRow1 = `\n**#${index + 1} [${options.title} [${options.version}]](https://osu.ppy.sh/b/${options.beatmapId})** ${options.modsPlay} [${options.stars}★]\n`;
    const textRow2 = `${options.grade} **${options.pp}**${options.ifFcValue} (${options.accuracy}) ${options.comboValue} <t:${options.submittedTime}:R>\n`;
    const textRow3 = `${options.totalScore} ${options.accValues}`;
    description.push(textRow1 + textRow2 + textRow3);

    return new EmbedBuilder()
      .setAuthor({ url: user.userUrl, name: `${user.username}: ${user.pp} (#${user.globalRank} ${user.countryCode.toUpperCase()}#${user.countryRank})`, iconURL: `https://osu.ppy.sh/images/flags/${user.countryCode.toUpperCase()}.png` })
      .setThumbnail(user.userAvatar)
      .setDescription(description.join(""));
  }

  let description = [];

  const startPage = page! * 5;
  const endPage = startPage + 5;

  for (let i = startPage; i < endPage && i < plays.length; i++) {
    const options = await new ScoreDetails().initialize(plays, i, mode, isTops);
    const textRow1 = `\n**#${i + 1} [${options.title} [${options.version}]](https://osu.ppy.sh/b/${options.beatmapId})** ${options.modsPlay} [${options.stars}★]\n`;
    const textRow2 = `${options.grade} **${options.pp}**${options.ifFcValue} (${options.accuracy}) ${options.comboValue} <t:${options.submittedTime}:R>\n`;
    const textRow3 = `${options.totalScore} ${options.accValues}`;
    description.push(textRow1 + textRow2 + textRow3);
  }

  return new EmbedBuilder()
    .setAuthor({ url: user.userUrl, name: `${user.username}: ${user.pp} (#${user.globalRank} ${user.countryCode.toUpperCase()}#${user.countryRank})`, iconURL: `https://osu.ppy.sh/images/flags/${user.countryCode.toUpperCase()}.png` })
    .setThumbnail(user.userAvatar)
    .setDescription(description.join(""));
}
