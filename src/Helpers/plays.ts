import { getUsernameFromArgs, Interactionhandler, nextButton, previousButton, buildActionRow, buttonBoolsIndex, buttonBoolsTops, specifyButton } from "../utils";
import { Message, ChatInputCommandInteraction, ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { UserDetails, ButtonActions, ScoreDetails, MyClient } from "../classes";
import { osuModes, commands } from "../types";
import { v2 } from "osu-api-extended";

export async function start({ isTops, interaction, passOnly: passOnlyArg, args, mode: modeArg, number, recentTop, client }: { isTops: boolean; interaction: Message | ChatInputCommandInteraction; passOnly?: boolean; args?: string[]; mode?: osuModes; number?: number; recentTop?: boolean; client: MyClient }) {
  const argOptions = Interactionhandler(interaction, args);
  const reply = argOptions.reply;
  argOptions.mode = modeArg ?? argOptions.mode;
  argOptions.passOnly = passOnlyArg ?? argOptions.passOnly;

  const indexThing = number ?? argOptions.index;
  const index = isNaN(indexThing) ? (isTops ? undefined : 0) : indexThing;

  const { mode, passOnly } = argOptions;

  const userOptions = getUsernameFromArgs(argOptions.author, argOptions.userArgs);
  if (!userOptions) {
    return reply("Something went wrong.");
  }
  if (userOptions.user?.status === false) {
    return reply(userOptions.user.message);
  }
  const flags = userOptions.flags;
  const page = isTops ? parseInt((flags.p as string) || (flags.page as string)) - 1 || 0 : undefined;

  const user = await v2.user.details(userOptions.user, mode);
  if (!user.id) {
    return reply(`The user \`${userOptions.user}\` does not exist in Bancho.`);
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
            .join("") ===
          str
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
    return reply(`The user \`${user.username}\` does not have any ${isTops ? "top" : "recent"} plays in Bancho.`);
  }

  if (page && (page < 0 || page >= Math.ceil(plays.length / 5))) {
    return reply(`Please provide a valid page (between 1 and ${Math.ceil(plays.length / 5)})`);
  }

  const userDetailOptions = new UserDetails(user, mode);

  const recentOptions = { user: userDetailOptions, plays, mode: mode, index, isTops };
  const topsOptions = { user: userDetailOptions, plays, mode: mode, page, index: index!, isTops };
  const embed = isTops ? await getSubsequentPlays(topsOptions) : await getRecentPlays(recentOptions);

  const embedOptions = isTops ? topsOptions : recentOptions;

  const components = [buildActionRow([previousButton, specifyButton, nextButton], [index! >= 0 ? buttonBoolsIndex("previous", embedOptions) : buttonBoolsTops("previous", embedOptions), false, index! >= 0 ? buttonBoolsIndex("next", embedOptions) : buttonBoolsTops("next", embedOptions)])];
  const response = await reply({ content: `Found \`${plays.length}\` plays`, embeds: [embed], components });
  client.sillyOptions[response.id] = { buttonHandler: isTops ? "handleTopsButtons" : "handleRecentButtons", type: commands[isTops ? "Top" : "Recent"], embedOptions, response, pageBuilder: isTops ? getSubsequentPlays : getRecentPlays, initializer: argOptions.author };
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
      name: `${options.globalPlacement.length > 0 ? options.globalPlacement + "\n" : ""}${options.grade} ${options.percentagePassed}${options.modsPlay} • **${options.totalScore} • ${options.accuracy}** <t:${options.submittedTime}:R>`,
      value: `${options.totalResult}\n${options.ifFcValue} • \`Try #${options.retries}\`\n\nBPM: \`${options.bpm}\` Length: \`${options.minutesTotal}:${options.secondsTotal}\`\n\`${options.mapValues}\``,
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
