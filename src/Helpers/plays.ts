import { getUsernameFromArgs, Interactionhandler, nextButton, previousButton, buildActionRow, buttonBoolsIndex, buttonBoolsTops } from "../utils";
import { Message, ChatInputCommandInteraction, ButtonInteraction, EmbedBuilder } from "discord.js";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { UserDetails, ButtonActions, ScoreDetails } from "../classes";
import { v2 } from "osu-api-extended";
import { osuModes } from "../types";

export async function start({ isTops, interaction, passOnly: passOnlyArg, args, mode: modeArg, number, recentTop }: { isTops: boolean; interaction: Message | ChatInputCommandInteraction; passOnly?: boolean; args?: string[]; mode?: osuModes; number?: number; recentTop?: boolean }) {
  const argOptions = Interactionhandler(interaction, args);
  argOptions.mode = modeArg ?? argOptions.mode;
  argOptions.passOnly = passOnlyArg ?? argOptions.passOnly;

  const indexThing = number ?? argOptions.index;
  const index = isNaN(indexThing) ? (isTops ? undefined : 0) : indexThing;

  const { mode, passOnly } = argOptions;

  const userOptions = getUsernameFromArgs(argOptions.author, argOptions.userArgs);
  if (!userOptions) {
    return argOptions.reply("Something went wrong.");
  }
  if (userOptions.user?.status === false) {
    return argOptions.reply(userOptions.user.message);
  }
  const flags = userOptions.flags;
  const page = isTops ? parseInt((flags.p as string) || (flags.page as string)) - 1 || 0 : undefined;

  const user = await v2.user.details(userOptions.user, mode);
  if (!user.id) {
    return argOptions.reply(`The user \`${userOptions.user}\` does not exist in Bancho.`);
  }

  let plays = await v2.scores.user.category(user.id, isTops ? "best" : "recent", {
    limit: isTops ? "100" : "50",
    include_fails: !passOnly,
    mode: mode,
  });
  plays = recentTop ? plays.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : plays;

  if (plays.length === 0) {
    return argOptions.reply(`The user \`${user.username}\` does not have any ${isTops ? "top" : "recent"} plays in Bancho.`);
  }

  if (page && (page < 0 || page >= Math.ceil(plays.length / 5))) {
    return argOptions.reply(`Please provide a valid page (between 1 and ${Math.ceil(plays.length / 5)})`);
  }

  const userDetailOptions = new UserDetails(user, mode);

  const recentOptions = { user: userDetailOptions, plays, mode: mode, index, isTops };
  const topsOptions = { user: userDetailOptions, plays, mode: mode, page, index: index!, isTops };
  const embed = isTops ? await getSubsequentPlays(topsOptions) : await getRecentPlays(recentOptions);

  const components = [buildActionRow([previousButton, nextButton], [index! >= 0 ? buttonBoolsIndex("previous", isTops ? topsOptions : recentOptions) : buttonBoolsTops("previous", isTops ? topsOptions : recentOptions), index! >= 0 ? buttonBoolsIndex("next", isTops ? topsOptions : recentOptions) : buttonBoolsTops("next", isTops ? topsOptions : recentOptions)])];
  const response = await argOptions.reply({ embeds: [embed], components });

  const filter = (i: any) => i.user.id === argOptions.author.id;
  const collector = response.createMessageComponentCollector({ time: 60000, filter });

  collector.on("collect", async function (i: ButtonInteraction) {
    await ButtonActions[isTops ? "handleTopsButtons" : "handleRecentButtons"]({ pageBuilder: isTops ? getSubsequentPlays : getRecentPlays, options: isTops ? topsOptions : recentOptions, i, response });
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
      name: `${options.grade} ${options.percentagePassed}${options.modsPlay} • **${options.totalScore} • ${options.accuracy}** <t:${options.submittedTime}:R>`,
      value: `${options.totalResult}\n${options.ifFcValue} Try #${options.retries}\n\nBPM: \`${options.bpm}\` Length: \`${options.minutesTotal}:${options.secondsTotal}\`\n\`${options.mapValues}\``,
    })
    .setThumbnail(`https://assets.ppy.sh/beatmaps/${options.mapsetId}/covers/list.jpg`)
    .setFooter({ text: `by ${options.creatorUsername}, ${options.mapStatus}`, iconURL: `https://a.ppy.sh/${options.creatorId}?1668890819.jpeg` });
}

async function getSubsequentPlays({ user, plays, mode, page, index, isTops }: { user: UserDetails; plays: ScoreResponse[]; mode: osuModes; page: number | undefined; index: number; isTops: boolean }) {
  if (index! >= 0) {
    const options = await new ScoreDetails().initialize(plays, index, mode, isTops);

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
        name: `#${options.placement}- ${options.grade} ${options.modsPlay}  **${options.totalScore}  ${options.accuracy}** <t:${options.submittedTime}:R>`,
        value: `${options.totalResult}${options.ifFcValue.length > 0 ? "\n" + options.ifFcValue : ""}\n\nBPM: \`${options.bpm}\` Length: \`${options.minutesTotal}:${options.secondsTotal}\`\n\`${options.mapValues}\``,
      })
      .setThumbnail(`https://assets.ppy.sh/beatmaps/${options.mapsetId}/covers/list.jpg`)
      .setFooter({ text: `by ${options.creatorUsername}, ${options.mapStatus}`, iconURL: `https://a.ppy.sh/${options.creatorId}?1668890819.jpeg` });
  }

  let description = [];

  const startPage = page! * 5;
  const endPage = startPage + 5;

  for (let i = startPage; i < endPage && i < plays.length; i++) {
    const options = await new ScoreDetails().initialize(plays, i, mode, isTops);
    const textRow1 = `\n**#${options.placement} [${options.title} [${options.version}]](https://osu.ppy.sh/b/${options.beatmapId})** ${options.modsPlay} [${options.stars}★]\n`;
    const textRow2 = `${options.grade} **${options.pp}pp** ${options.ifFcValue.length > 0 ? `~~[**${options.fcPp}pp**]~~ ` : ""}(${options.accuracy}) ${options.comboValue} <t:${options.submittedTime}:R>\n`;
    const textRow3 = `>> ${options.totalScore} ${options.accValues}`;
    description.push(textRow1 + textRow2 + textRow3);
  }

  return new EmbedBuilder()
    .setAuthor({ url: user.userUrl, name: `${user.username}: ${user.pp} (#${user.globalRank} ${user.countryCode.toUpperCase()}#${user.countryRank})`, iconURL: `https://osu.ppy.sh/images/flags/${user.countryCode.toUpperCase()}.png` })
    .setThumbnail(user.userAvatar)
    .setDescription(description.join(""))
    .setFooter({ text: `Page ${page! + 1}/${Math.ceil(plays.length / 5)}` });
}
