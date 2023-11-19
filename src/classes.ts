import { rulesets, getMap, insertData, getRetryCount, grades, formatNumber, buildActionRow, showLessButton, showMoreButton, previousButton, nextButton, loadingButtons, buttonBoolsIndex, buttonBoolsTops, downloadMap, getPerformanceDetails, osuEmojis } from "./utils";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { response as BeatmapResponse } from "osu-api-extended/dist/types/v2_beatmap_id_details";
import { response as UserOsu } from "osu-api-extended/dist/types/v2_user_details";
import { Message, ButtonInteraction } from "discord.js";
import { tools, v2 } from "osu-api-extended";
import { osuModes } from "./types";

export class UserDetails {
  username: string;
  userCover: string;
  userAvatar: string;
  userUrl: string;
  coverUrl: string;
  userFlag: string;
  countryCode: string;
  highestRank: string | undefined;
  highestRankTime: number | undefined;
  recommendedStarRating: string;
  userJoinedAgo: string;
  formattedDate: string;
  globalRank: string;
  countryRank: string;
  pp: string;
  accuracy: string;
  level: string;
  playCount: string;
  playHours: string;
  followers: string;
  maxCombo: string;
  rankS: string;
  rankA: string;
  rankSs: string;
  rankSh: string;
  rankSsh: string;
  emoteA: string;
  emoteS: string;
  emoteSh: string;
  emoteSs: string;
  emoteSsh: string;
  rankedScore: string;
  totalScore: string;
  objectsHit: string;
  occupation: string;
  interest: string;
  location: string;

  constructor(user: UserOsu, mode: osuModes) {
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    } as any;

    const stats = user.statistics;
    const date = new Date(user.join_date);
    const months = Math.floor((Date.now() - date.valueOf()) / (1000 * 60 * 60 * 24 * 30));

    this.username = user.username;
    this.userCover = user.cover_url;
    this.userAvatar = user.avatar_url;
    this.userUrl = `https://osu.ppy.sh/users/${user.id}/${mode}`;
    this.coverUrl = user.cover_url;
    this.userFlag = `https://osu.ppy.sh/images/flags/${user.country_code}.png`;
    this.countryCode = user.country.code;
    this.globalRank = stats.global_rank?.toLocaleString() || "-";
    this.countryRank = stats.country_rank?.toLocaleString() || "-";
    this.pp = stats.pp.toLocaleString();
    this.rankedScore = stats.ranked_score.toLocaleString();
    this.totalScore = stats.total_score.toLocaleString();
    this.objectsHit = stats.total_hits.toLocaleString();
    this.occupation = `**Occupation:**\n \`${user.occupation}\`\n` ?? "";
    this.interest = `**Interests:**\n \`${user.interests}\`\n` ?? "";
    this.location = `**Location:**\n \`${user.location}\`` ?? "";
    this.highestRank = user.rank_highest?.rank.toLocaleString() || undefined;
    this.highestRankTime = user.rank_highest ? new Date(user.rank_highest.updated_at).getTime() / 1000 : undefined;
    this.recommendedStarRating = (Math.pow(stats.pp, 0.4) * 0.195).toFixed(2);
    this.userJoinedAgo = (months / 12).toFixed(1);
    this.formattedDate = date.toLocaleDateString("en-US", timeOptions);
    this.accuracy = stats.hit_accuracy.toFixed(2);
    this.level = `${user.statistics.level.current}.${stats.level.progress.toString(10).padStart(2, "0")}`;
    this.playCount = stats.play_count.toLocaleString();
    this.playHours = (stats.play_time / 3600).toFixed(0);
    this.followers = user.follower_count.toLocaleString();
    this.maxCombo = stats.maximum_combo.toLocaleString();
    this.rankS = stats.grade_counts.s.toLocaleString();
    this.rankA = stats.grade_counts.a.toLocaleString();
    this.rankSs = stats.grade_counts.ss.toLocaleString();
    this.rankSh = stats.grade_counts.sh.toLocaleString();
    this.rankSsh = stats.grade_counts.ssh.toLocaleString();
    this.emoteA = grades.A;
    this.emoteS = grades.S;
    this.emoteSh = grades.SH;
    this.emoteSs = grades.X;
    this.emoteSsh = grades.XH;
  }
}

export class ScoreDetails {
  beatmapId!: number;
  countCircles!: number;
  countSliders!: number;
  countSpinners!: number;
  hitLength!: number;
  placement!: number;
  version!: string;
  creatorId!: number;
  creatorUsername!: string;
  mapStatus!: string;
  mapsetId!: number;
  count100!: number;
  count300!: number;
  count50!: number;
  countGeki!: number;
  countKatu!: number;
  countMiss!: number;
  accValues!: string;
  retries!: number | undefined;
  totalScore!: string;
  percentagePassed!: string;
  accuracy!: string;
  artist!: string;
  title!: string;
  grade!: string;
  modsPlay!: string;
  submittedTime!: number;
  minutesTotal!: string;
  secondsTotal!: string;
  bpm!: string;
  mapValues!: string;
  performance: any;
  totalResult!: string;
  ifFcValue!: string;
  stars!: string;
  comboValue!: string;
  pp!: string;
  fcPp!: string;
  ssPp!: string;
  globalPlacement!: string;

  async initialize(plays: ScoreResponse[], index: number, mode: osuModes, isTops: boolean, isCompare?: boolean, perfDetails?: any, beatmap?: BeatmapResponse) {
    const play = plays[index];
    const rulesetId = rulesets[mode];

    (play.beatmap as any) = isCompare ? beatmap : play.beatmap;
    (play.beatmapset as any) = isCompare ? beatmap?.beatmapset : play.beatmapset;

    const { id: beatmapId, count_circles, count_sliders, count_spinners, hit_length, version } = play.beatmap;
    const { user_id: creatorId, creator: creatorUsername, status: mapStatus, id: mapsetId, artist, title } = play.beatmapset;
    const { count_100, count_300, count_50, count_geki, count_katu, count_miss } = play.statistics;

    let file;
    if (!isCompare) {
      file = await getMap(beatmapId.toString())?.data;
      if (!file || !["ranked", "loved", "approved"].includes(mapStatus)) {
        file = await downloadMap(beatmapId);
        insertData({ table: "maps", id: beatmapId.toString(), data: file });
      }
    }

    const objectshit = count_300 + count_100 + count_50 + count_miss;
    const objects = count_circles + count_sliders + count_spinners;

    const percentageNum = Number((objectshit / objects) * 100);

    this.percentagePassed = percentageNum === 100 || play.passed == true ? "" : `@${percentageNum.toFixed(1)}% `;

    const retryCounter = isCompare ? undefined : getRetryCount(plays.map((x) => x.beatmap.id).splice(index, plays.length), beatmapId);

    this.modsPlay = play.mods.length > 0 ? `**+${play.mods.join("").toUpperCase()}**` : "**+NM**";

    let hitLength = play.beatmap.hit_length;
    let totalLength = play.beatmap.hit_length;
    if (this.modsPlay.toLowerCase().includes("dt")) {
      hitLength = hitLength! / 1.5;
      totalLength = totalLength! / 1.5;
    }

    const performance = isCompare ? perfDetails : getPerformanceDetails({ modsArg: play.mods, maxCombo: play.max_combo, rulesetId, hitValues: { count_100, count_300, count_50, count_geki, count_katu, count_miss }, mapText: file });

    this.globalPlacement = "";
    if (play.passed && play.best_id) {
      const scoreGlobal = await v2.scores.details(play.best_id, mode);
      if (scoreGlobal && scoreGlobal.rank_global < 10000) {
        this.globalPlacement = `**__Global Rank #${scoreGlobal.rank_global}:__**`;
      }
    }

    this.beatmapId = beatmapId;
    this.countCircles = count_circles;
    this.countSliders = count_sliders;
    this.countSpinners = count_spinners;
    this.hitLength = hit_length;
    this.placement = play.position;
    this.version = version;
    this.creatorId = creatorId;
    this.creatorUsername = creatorUsername;
    this.mapStatus = mapStatus;
    this.mapsetId = mapsetId;
    this.count100 = count_100;
    this.count300 = count_300;
    this.count50 = count_50;
    this.countGeki = count_geki;
    this.countKatu = count_katu;
    this.countMiss = count_miss;
    this.retries = retryCounter;
    this.totalScore = play.score.toLocaleString();
    this.accuracy = `${Number(play.accuracy * 100).toFixed(2)}%`;
    this.artist = artist;
    this.title = title;
    this.grade = grades[play.rank];
    this.submittedTime = new Date(play.created_at).getTime() / 1000;
    this.minutesTotal = Math.floor(totalLength! / 60).toFixed();
    this.secondsTotal = (totalLength! % 60).toFixed().toString().padStart(2, "0");
    this.bpm = performance.mapValues.bpm.toFixed();
    this.mapValues = `AR: ${formatNumber(performance.mapValues.ar, 1)} OD: ${formatNumber(performance.mapValues.od, 1)} CS: ${formatNumber(performance.mapValues.cs, 1)} HP: ${formatNumber(performance.mapValues.hp, 2)}`;
    this.stars = performance.maxPerf.difficulty.stars.toFixed(2);

    this.accValues = `{ **${rulesetId === 3 ? count_geki + "/" : ""}${count_300}**/${rulesetId === 3 ? count_katu + "/" : ""}${count_100}/${rulesetId === 1 ? "" : count_50 + "/"}${count_miss} }`;
    this.comboValue = `[ **${play.max_combo}**x/${performance.maxPerf.difficulty.maxCombo}x ]`;
    this.pp = performance.curPerf.pp.toFixed(2);
    this.fcPp = performance.fcPerf.pp.toFixed(2);
    this.ssPp = performance.maxPerf.pp.toFixed(2);

    this.totalResult = `**${this.pp}**/${this.ssPp}pp • ${this.comboValue} • ${this.accValues}`;
    this.ifFcValue = "";
    if ((performance.curPerf as any).effectiveMissCount > 0) {
      const Map300CountFc = objects - count_100 - count_50;

      const FcAcc = tools.accuracy(
        {
          300: Map300CountFc.toString(),
          geki: count_geki.toString(),
          100: count_100.toString(),
          katu: count_katu.toString(),
          50: count_50.toString(),
          0: "0",
        },
        mode
      );

      this.ifFcValue = `If FC: **${this.fcPp}**pp for **${FcAcc.toFixed(2)}%**`;
    }

    return this;
  }

  constructor() {}
}

export class BeatmapDetails {
  title!: string;
  artist!: string;
  version!: string;
  mode!: string;
  id!: number;
  setId!: number;
  creator!: string;
  rulesetId!: number;
  totalObjects: any;
  stars!: string;
  mods!: string;
  bpm!: string;
  totalLength!: number;
  mapLength!: string;
  maxCombo!: number;
  ar!: string;
  od!: string;
  hp!: string;
  cs!: string;
  favorited!: string;
  playCount!: string;
  ppValues!: string;
  links!: string;
  background!: string;
  updatedAt!: string;
  modeEmoji!: string;

  async initialize(map: BeatmapResponse, valueOptions: { mods: string[]; accuracy?: number; ar?: number; od?: number; cs?: number }, file?: string) {
    const set = map.beatmapset;
    file = file || (await getMap(map.id.toString())?.data);

    this.title = set.title;
    this.artist = set.artist;
    this.version = map.version;
    this.mode = map.mode;
    this.id = map.id;
    this.setId = map.beatmapset_id;
    this.creator = map.beatmapset.creator;
    this.rulesetId = rulesets[this.mode];
    this.totalObjects = map.count_circles + map.count_sliders + map.count_spinners;

    const performance: Record<number, ReturnType<typeof getPerformanceDetails>> = {};
    [100, 99, 98, 95].forEach((accuracy) => {
      performance[accuracy] = getPerformanceDetails({
        modsArg: valueOptions.mods,
        maxCombo: map.max_combo,
        rulesetId: rulesets[this.mode],
        hitValues: {},
        accuracy: accuracy,
        mapText: file!,
      });
    });

    this.stars = performance[100].maxPerf.difficulty.stars.toFixed(2);
    this.mods = "+" + valueOptions.mods.join("");
    this.bpm = performance[100].mapValues.bpm.toFixed();
    this.totalLength = ["DT", "NC"].includes(this.mods.toUpperCase()) ? map.hit_length / 1.5 : map.hit_length;
    this.mapLength = `${Math.floor(this.totalLength / 60).toFixed()}:${(this.totalLength % 60).toFixed().toString().padStart(2, "0")}`;
    this.maxCombo = map.max_combo;

    this.ar = ["taiko", "mania"].includes(this.mode) ? "-" : performance[100].mapValues.ar.toFixed(1);
    this.od = performance[100].mapValues.od.toFixed(1);
    this.hp = performance[100].mapValues.hp.toFixed(1);
    this.cs = ["taiko", "mania"].includes(this.mode) ? "-" : performance[100].mapValues.ar.toFixed(2);

    this.favorited = map.beatmapset.favourite_count.toLocaleString();
    this.playCount = map.beatmapset.play_count.toLocaleString();

    this.ppValues = `\`\`\`Acc | PP\n100%: ${performance[100].fcPerf.pp.toFixed()}pp\n99%:  ${performance[99].fcPerf.pp.toFixed()}pp\n98%:  ${performance[98].fcPerf.pp.toFixed()}pp\n95%:  ${performance[95].fcPerf.pp.toFixed()}pp\`\`\``;
    this.links = `<:chimu:1117792339549761576>[Chimu](https://chimu.moe/d/${this.setId})\n<:beatconnect:1075915329512931469>[Beatconnect](https://beatconnect.io/b/${this.setId})\n:notes:[Song Preview](https://b.ppy.sh/preview/${this.setId}.mp3)\n🎬[Map Preview](https://osu.pages.dev/preview#${this.id})\n🖼️[Full Background](https://assets.ppy.sh/beatmaps/${this.setId}/covers/raw.jpg)`;
    this.background = `https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/cover.jpg`;
    this.updatedAt = `${map.status === "ranked" ? "Ranked at" : map.status === "loved" ? "Loved at" : map.status === "qualified" ? "Qualified at" : "Last updated at"} ${new Date(map.last_updated).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
    this.modeEmoji = osuEmojis[map.mode];

    return this;
  }

  constructor() {}
}

export class ButtonActions {
  static async handleProfileButtons(pageBuilders: any[], i: ButtonInteraction, userDetailOptions: UserDetails, response: Message) {
    const customId = i.customId;
    await i.update({ components: [loadingButtons as any] });
    if (customId === "more") {
      const page = pageBuilders[1](userDetailOptions);
      response.edit({ embeds: [page], components: [showLessButton as any] });
    } else if (customId === "less") {
      const page = pageBuilders[0](userDetailOptions);
      response.edit({ embeds: [page], components: [showMoreButton as any] });
    }
  }

  static async handleRecentButtons({ pageBuilder, options, i, response }: { pageBuilder: any; options: any; i: ButtonInteraction; response: Message }) {
    const customId = i.customId;

    const getComponents = () => [buildActionRow([previousButton, nextButton], [options.index === 0, options.index + 1 === options.plays.length])] as any;
    await i.update({ components: [loadingButtons as any] });
    if (customId === "next") {
      options.index++;
      response.edit({ embeds: [await pageBuilder(options)], components: getComponents() });
    } else if (customId === "previous") {
      options.index--;
      response.edit({ embeds: [await pageBuilder(options)], components: getComponents() });
    }
  }

  static async handleTopsButtons({ pageBuilder, options, i, response }: { pageBuilder: any; options: any; i: ButtonInteraction; response: Message }) {
    const customId = i.customId;
    const index = options.index;

    const getComponents = () => [buildActionRow([previousButton, nextButton], [index! >= 0 ? buttonBoolsIndex("previous", options) : buttonBoolsTops("previous", options), index! >= 0 ? buttonBoolsIndex("next", options) : buttonBoolsTops("next", options)])] as any;
    await i.update({ components: [loadingButtons as any] });
    if (customId === "next") {
      options.page++;
      options.index++;
      response.edit({ embeds: [await pageBuilder(options)], components: getComponents() });
    } else if (customId === "previous") {
      options.page--;
      options.index--;
      response.edit({ embeds: [await pageBuilder(options)], components: getComponents() });
    }
  }
}

export class CalculateHitResults {
  static standard({ accuracy, totalHitObjects, countMiss, count100, count50 }: { accuracy: number; totalHitObjects: number; countMiss: number; count50?: number; count100?: number }) {}

  constructor() {}
}
