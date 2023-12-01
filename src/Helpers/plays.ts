import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { v2 } from "osu-api-extended";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { getScore, getUser } from "../functions";
import { commands, ExtendedClient, Locales, osuModes, UserInfo } from "../Structure/index";
import { buildActionRow, buttonBoolsIndex, buttonBoolsTops, downloadMap, firstButton, getMap, getUsernameFromArgs, insertData, Interactionhandler, lastButton, nextButton, previousButton, specifyButton } from "../utils";

export async function start({ isTops, interaction, passOnly: passOnlyArg, args, mode: modeArg, number, recentTop, client, locale }: { isTops: boolean; interaction: Message | ChatInputCommandInteraction; passOnly?: boolean; args?: string[]; mode?: osuModes; number?: number; recentTop?: boolean; client: ExtendedClient; locale: Locales }) {
  const argOptions = Interactionhandler(interaction, args);
  const reply = argOptions.reply;
  argOptions.mode = modeArg ?? argOptions.mode;
  argOptions.passOnly = passOnlyArg ?? argOptions.passOnly;

  const indexThing = number ?? argOptions.index;
  const index = isNaN(indexThing) ? (isTops ? undefined : 0) : indexThing;

  const { mode, passOnly } = argOptions;

  const userOptions = getUsernameFromArgs(argOptions.author, argOptions.userArgs);
  if (!userOptions) {
    return reply(locale.fails.error);
  }
  if (userOptions.user?.status === false) {
    return reply(userOptions.user.message);
  }
  const flags = userOptions.flags;
  const page = isTops ? parseInt((flags.p as string) || (flags.page as string)) - 1 || 0 : undefined;

  const user = await v2.user.details(userOptions.user, mode);
  if (!user.id) {
    return reply(locale.fails.userDoesntExist.replace("{USER}", userOptions.user));
  }

  let plays = await v2.scores.user.category(user.id, isTops ? "best" : "recent", {
    limit: isTops ? "100" : "50",
    include_fails: !passOnly,
    mode: mode,
  });
  plays = recentTop ? plays.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : plays;

  const mods = userOptions?.mods?.codes;

  plays = mods
    ? plays.filter((score) => {
      let userMods = mods.join("").toUpperCase();
      const scoreMods = score.mods.join("").toUpperCase();
      const force = userOptions!.mods!.force;

      if (userMods === "NM") {
        return userOptions!.mods!.include ? scoreMods === "" : userOptions!.mods!.remove ? scoreMods !== "" : undefined;
      }

      const includedBool = (str: string) =>
        scoreMods
          .match(/.{1,2}/g)
          ?.sort()
          .join("")
          .includes((str.match(/.{1,2}/g) || [""]).sort().join(""));

      const exactBool = (str: string) =>
        scoreMods
          .match(/.{1,2}/g)
          ?.sort()
          .join("")
          === str
            .match(/.{1,2}/g)
            ?.sort()
            .join("");

      if (userOptions!.mods!.include) {
        return (force ? exactBool : includedBool)(userMods);
      } else if (userOptions!.mods!.remove) {
        return !(force ? exactBool : includedBool)(userMods);
      }

      return scoreMods === (userMods === "NM" ? "" : userMods);
    })
    : plays;

  if (plays.length === 0) {
    return reply(locale.embeds.plays.noScores.replace("{USERNAME}", user.username).replace("{TYPE}", isTops ? locale.embeds.plays.top : locale.embeds.plays.recent));
  }

  if (page && (page < 0 || page >= Math.ceil(plays.length / 5))) {
    return reply(locale.fails.provideValidPage.replace("{MAXVALUE}", Math.ceil(plays.length / 5).toString()));
  }

  const userDetailOptions = getUser({ user, mode, locale });

  const recentOptions = { user: userDetailOptions, plays, mode: mode, index: index!, isTops, locale };
  const topsOptions = { user: userDetailOptions, plays, mode: mode, page, index: index!, isTops, locale };
  const embed = isTops ? await getSubsequentPlays(topsOptions) : await getRecentPlays(recentOptions);

  const embedOptions = isTops ? topsOptions : recentOptions;

  const components = [buildActionRow([firstButton, previousButton, specifyButton, nextButton, lastButton], [page === 0 || index === 0, index! >= 0 ? buttonBoolsIndex("previous", embedOptions) : buttonBoolsTops("previous", embedOptions), false, index! >= 0 ? buttonBoolsIndex("next", embedOptions) : buttonBoolsTops("next", embedOptions), plays.length - 1 === page || plays.length - 1 === index])];
  const response = await reply({ content: locale.embeds.plays.playsFound.replace("{LENGTH}", plays.length.toString()), embeds: [embed], components });
  client.sillyOptions[response.id] = { buttonHandler: isTops ? "handleTopsButtons" : "handleRecentButtons", type: commands[isTops ? "Top" : "Recent"], embedOptions, response, pageBuilder: isTops ? getSubsequentPlays : getRecentPlays, initializer: argOptions.author };
}

async function getRecentPlays({ user, plays, mode, index, isTops, locale }: { user: UserInfo; plays: ScoreResponse[]; mode: osuModes; index: number; isTops: boolean; locale: Locales }) {
  const options = await getScore({ plays, index, mode, locale });

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
      name: `${options.globalPlacement?.length && options.globalPlacement?.length > 0 ? options.globalPlacement + "\n" : ""}${options.grade} ${options.percentagePassed}${options.modsPlay} • **${options.totalScore} • ${options.accuracy}** <t:${options.submittedTime}:R>`,
      value: `${options.totalResult}\n${options.ifFcValue} • \`${locale.embeds.plays.try} #${options.retries}\`\n\nBPM: \`${options.bpm}\` ${locale.embeds.plays.length}: \`${options.minutesTotal}:${options.secondsTotal}\`\n\`${options.mapValues}\``,
    })
    .setThumbnail(`https://assets.ppy.sh/beatmaps/${options.mapsetId}/covers/list.jpg`)
    .setFooter({ text: `${locale.embeds.plays.mapper.replace("{USERNAME}", options.creatorUsername)}, ${options.mapStatus}`, iconURL: `https://a.ppy.sh/${options.creatorId}?1668890819.jpeg` });
}

async function getSubsequentPlays({ user, plays, mode, page, index, isTops, locale }: { user: UserInfo; plays: ScoreResponse[]; mode: osuModes; page: number | undefined; index: number; isTops: boolean; locale: Locales }) {
  if (index! >= 0) {
    const beatmapId = plays[index].beatmap.id;
    let file = getMap(beatmapId.toString())?.data;
    if (!file || !["ranked", "loved", "approved"].includes(plays[index].beatmap.status)) {
      file = await downloadMap(beatmapId);
      insertData({ table: "maps", id: beatmapId.toString(), data: file });
    }

    const options = await getScore({ plays, index, mode, file, locale });

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
        value: `${options.totalResult}${options.ifFcValue?.length && options.ifFcValue?.length > 0 ? "\n" + options.ifFcValue : ""}\n\nBPM: \`${options.bpm}\` ${locale.embeds.plays.length}: \`${options.minutesTotal}:${options.secondsTotal}\`\n\`${options.mapValues}\``,
      })
      .setThumbnail(`https://assets.ppy.sh/beatmaps/${options.mapsetId}/covers/list.jpg`)
      .setFooter({ text: `${locale.embeds.plays.mapper.replace("{USERNAME}", options.creatorUsername)}, ${options.mapStatus}`, iconURL: `https://a.ppy.sh/${options.creatorId}?1668890819.jpeg` });
  }

  let description = [];

  const startPage = page! * 5;
  const endPage = startPage + 5;

  for (let i = startPage; i < endPage && i < plays.length; i++) {
    const beatmapId = plays[i].beatmap.id;
    let file = getMap(beatmapId.toString())?.data;
    if (!file || !["ranked", "loved", "approved"].includes(plays[i].beatmap.status)) {
      file = await downloadMap(beatmapId);
      insertData({ table: "maps", id: beatmapId.toString(), data: file });
    }

    const options = await getScore({ plays, index: i, mode, file, locale });
    const textRow1 = `\n**#${options.placement} [${options.title} [${options.version}]](https://osu.ppy.sh/b/${options.beatmapId})** ${options.modsPlay} [${options.stars}★]\n`;
    const textRow2 = `${options.grade} **${options.pp}pp** ${options.ifFcValue?.length && options.ifFcValue.length > 0 ? `~~[**${options.fcPp}pp**]~~ ` : ""}(${options.accuracy}) ${options.comboValue} <t:${options.submittedTime}:R>\n`;
    const textRow3 = `>> ${options.totalScore} ${options.accValues}`;
    description.push(textRow1 + textRow2 + textRow3);
  }

  return new EmbedBuilder()
    .setAuthor({ url: user.userUrl, name: `${user.username}: ${user.pp} (#${user.globalRank} ${user.countryCode.toUpperCase()}#${user.countryRank})`, iconURL: `https://osu.ppy.sh/images/flags/${user.countryCode.toUpperCase()}.png` })
    .setThumbnail(user.userAvatar)
    .setDescription(description.join(""))
    .setFooter({ text: locale.embeds.page.replace("{PAGE}", `${page! + 1}/${Math.ceil(plays.length / 5)}`) });
}
