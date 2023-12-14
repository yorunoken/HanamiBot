import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { tools, v2 } from "osu-api-extended";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { response as UserResponse } from "osu-api-extended/dist/types/v2_user_details";
import { downloadingMapUserCache, updateDownloadingCache } from "../cache";
import { getUser } from "../functions";
import { Commands, ExtendedClient, Locales, NoChokePlayDetails, osuModes } from "../Structure/index";
import { buildActionRow, buttonBoolsTops, calculateWeightedScores, downloadMap, firstButton, getMapsInBulk, getPerformanceDetails, getUsernameFromArgs, grades, insertDataBulk, interactionhandler, lastButton, nextButton, previousButton, rulesets, specifyButton } from "../utils";

export async function start({ interaction, args, mode, client, locale }: { interaction: Message | ChatInputCommandInteraction; args?: string[]; mode?: osuModes; client: ExtendedClient; locale: Locales }) {
  const interactionOptions = interactionhandler(interaction, args);
  const { reply, author, userArgs } = interactionOptions;
  mode = (mode ?? interactionOptions.mode) as osuModes;

  const options = getUsernameFromArgs(author, userArgs);
  if (!options || options.user?.status === false) {
    return reply(options?.user.message ?? locale.fails.error);
  }

  const user = await v2.user.details(options.user, interactionOptions.mode);
  if (!user.id) {
    return reply(locale.fails.userDoesntExist(options.user));
  }

  let plays = await v2.scores.user.category(user.id, "best", {
    limit: "100",
    mode,
  });
  plays = options.flags.rev ? plays.sort((a, b) => Number(a.pp) - Number(b.pp)) : plays;
  getNoChoke(interactionOptions, client, plays, parseInt((options.flags.p as string) || (options.flags.page as string)) - 1 || 0, user, reply, mode, locale);
}

async function getNoChoke(interactionOptions: any, client: ExtendedClient, plays: ScoreResponse[], page: number, user: UserResponse, reply: (options: any) => Promise<Message<boolean>>, mode: osuModes, locale: Locales) {
  const files = await getFiles(plays, user, reply, locale);
  if (files === false) {
    return;
  }

  const newPlays: NoChokePlayDetails[] = plays
    .map((play) => {
      let { beatmap: map, statistics } = play;

      const misses = statistics.count_miss;
      statistics.count_300 += statistics.count_miss;
      statistics.count_miss = 0;

      const performance = getPerformanceDetails({ mapText: files[map.id], rulesetId: rulesets[mode], modsArg: play.mods, hitValues: statistics });
      performance.mapId = map.id;
      performance.playInfo.play = play;
      performance.playInfo.misses = misses;
      performance.playInfo.grade = tools.rank({ "0": "0", "100": statistics.count_100.toString(), "300": statistics.count_300.toString(), "50": statistics.count_50.toString(), geki: statistics.count_geki.toString(), katu: statistics.count_katu.toString() }, "DT", mode);

      return performance;
    })
    .sort((a, b) => b.fcPerf.pp - a.fcPerf.pp);

  const embedOptions = { user, plays: newPlays, page, mode, locale };
  const components = [buildActionRow([firstButton, previousButton, specifyButton, nextButton, lastButton], [page === 0, buttonBoolsTops("previous", embedOptions), false, buttonBoolsTops("next", embedOptions), plays.length - 1 === page])];
  const response = await reply({ embeds: [await getSubsequentPlays(embedOptions)], components });
  client.sillyOptions[response.id] = { buttonHandler: "handleTopsButtons", type: Commands["Top"], embedOptions, response, pageBuilder: getSubsequentPlays, initializer: interactionOptions.author };
}

async function getFiles(plays: ScoreResponse[], user: UserResponse, reply: (options: any) => Promise<Message<boolean>>, locale: Locales) {
  const mapIds = plays.map((play) => play.beatmap.id);
  let mapsInBulk = getMapsInBulk(mapIds);
  const missingMapIds = mapIds.filter((id) => !mapsInBulk.some((map: any) => map.id === id));
  if (missingMapIds.length > 0) {
    if (downloadingMapUserCache[user.id] === true) {
      reply({ embeds: [new EmbedBuilder().setTitle(locale.misc.warning).setDescription(locale.embeds.nochoke.alreadyDownloading(user.username)).setColor("Red")] });
      return false;
    }

    updateDownloadingCache(user.id, true);
    const message = await reply({ embeds: [new EmbedBuilder().setTitle(locale.misc.warning).setDescription(locale.embeds.nochoke.mapsArentInDb(user.username, missingMapIds.length)).setColor("Red")] });
    const data = (await downloadMap(mapIds)).map((map: any) => ({ id: map.id, data: map.contents }));
    insertDataBulk({
      table: "maps",
      object: data,
    });
    data.forEach((map: any) => {
      mapsInBulk = [...mapsInBulk, map];
    });
    updateDownloadingCache(user.id, false);
    message.edit({ embeds: [new EmbedBuilder().setTitle(locale.misc.success).setDescription(locale.embeds.nochoke.mapsDownloaded).setColor("Green")] });
  }

  return mapsInBulk.reduce((acc: any, { id, data }: { id: number; data: string }) => {
    acc[id] = data;
    return acc;
  }, {});
}

async function getSubsequentPlays({ user, plays, page, mode, locale }: { user: UserResponse; plays: NoChokePlayDetails[]; page: number; mode: osuModes; locale: Locales }) {
  const userDetails = getUser({ user, mode, locale });
  let description = [];

  const startPage = page * 5;
  const endPage = startPage + 5;

  const rulesetId = rulesets[mode];
  for (let i = startPage; i < endPage && i < plays.length; i++) {
    const options = plays[i];
    const play = options.playInfo.play;

    const { count_100, count_300, count_50, count_geki, count_katu, count_miss } = play.statistics;
    const mods = options.playInfo.play.mods;

    const accValues = `{ **${rulesetId === 3 ? count_geki + "/" : ""}${count_300}**/${rulesetId === 3 ? count_katu + "/" : ""}${count_100}/${rulesetId === 1 ? "" : count_50 + "/"}~~${count_miss}~~ } **•** Removed ${options.playInfo.misses} <:hit00:1061254490075955231>`;

    const textRow1 = `\n**#${i + 1} __~~[${play.position}]~~__ [${play.beatmapset.title} [${play.beatmap.version}]](https://osu.ppy.sh/b/${play.beatmap.id})** **+${mods.length > 0 ? mods.join("") : "NM"}** [${options.maxPerf.difficulty.stars.toFixed(2)}★]\n`;
    const textRow2 = `${grades[options.playInfo.grade]} ~~${play.pp}~~ ➜ **${options.fcPerf.pp.toFixed(2)}pp** **(${(play.accuracy * 100).toFixed(2)}%)**\n>> [${play.max_combo} ➜ ${options.maxPerf.difficulty.maxCombo}x / ${options.maxPerf.difficulty.maxCombo}x] <t:${new Date(play.created_at).getTime() / 1000}:R>\n`;
    const textRow3 = `>> ${play.score.toLocaleString()} ${accValues}`;
    description.push(textRow1 + textRow2 + textRow3);
  }

  const newTotalPp = calculateWeightedScores({ user, plays });
  return new EmbedBuilder()
    .setAuthor({ url: userDetails.userUrl, name: `${userDetails.username}: ${userDetails.pp} (#${userDetails.globalRank} ${userDetails.countryCode.toUpperCase()}#${userDetails.countryRank})`, iconURL: `https://osu.ppy.sh/images/flags/${userDetails.countryCode.toUpperCase()}.png` })
    .setTitle(`Total PP: ${user.statistics.pp.toFixed(2)}pp ➜ ${newTotalPp.toFixed(2)}pp (+${(newTotalPp - user.statistics.pp).toFixed(2)})`)
    .setThumbnail(userDetails.userAvatar)
    .setDescription(description.join(""))
    .setFooter({
      text: `${locale.embeds.page(`${page + 1}/${Math.ceil(plays.length / 5)}`)} • ${
        locale.embeds.nochoke.approximateRank(
          newTotalPp.toFixed(2),
          await fetch(`https://osudaily.net/api/pp.php?k=${Bun.env.OSU_DAILY_API}&m=${rulesetId}&t=pp&v=${newTotalPp}`)
            .then((res) => res.json())
            .then((res: any) => res?.rank?.toLocaleString()),
        )
      } `,
    });
}
