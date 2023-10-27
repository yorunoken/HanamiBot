import { User as UserDiscord, Message, ChatInputCommandInteraction, InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from "discord.js";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { response as UserOsu } from "osu-api-extended/dist/types/v2_user_details";
//@ts-ignore
import { Downloader, DownloadEntry } from "osu-downloader";
import { mods, tools } from "osu-api-extended";
import { Beatmap, Calculator } from "rosu-pp";
import { db } from "./Handlers/ready";
import { osuModes } from "./types";

export const grades: { [key: string]: string } = {
  A: "<:A_:1057763284327080036>",
  B: "<:B_:1057763286097076405>",
  C: "<:C_:1057763287565086790>",
  D: "<:D_:1057763289121173554>",
  F: "<:F_:1057763290484318360>",
  S: "<:S_:1057763291998474283>",
  SH: "<:SH_:1057763293491642568>",
  X: "<:X_:1057763294707974215>",
  XH: "<:XH_:1057763296717045891>",
};

const rulesets: { [key: string]: number } = {
  osu: 0,
  taiko: 1,
  fruits: 2,
  mania: 3,
};

export const buildActionRow = (buttons: ButtonBuilder[], disabledStates: boolean[] = []) => {
  const actionRow = new ActionRowBuilder();
  buttons.forEach((button, index) => {
    const isButtonDisabled = disabledStates[index] === true;
    actionRow.addComponents(isButtonDisabled ? button.setDisabled(true) : button.setDisabled(false));
  });
  return actionRow;
};

function getRetryCount(retryMap: any[], mapId: number) {
  let retryCounter = 0;
  for (let i = 0; i < retryMap.length; i++) {
    if (retryMap[i] === mapId) {
      retryCounter++;
    }
  }
  return retryCounter;
}

const formatNumber = (value: number, decimalPlaces: number) => value.toFixed(decimalPlaces).replace(/\.0+$/, "");
const errMsg = (message: string) => ({ status: false, message });
const getUserData = (userId: string) => getUser(userId) || errMsg(`The Discord user <@${userId}> hasn't linked their account to the bot yet!`);

const flags = ["i", "rev", "p"];
const argParser = (str: string, flags: string[]) => [...str.matchAll(/-(\w+)|(\w+)=(\S+)/g)].filter((m) => flags.includes(m[1]) || flags.includes(m[2])).map((m) => [m[1] || m[2], m[3]]);

export const loadingButtons = buildActionRow([new ButtonBuilder().setCustomId("wating").setLabel("Waiting..").setStyle(ButtonStyle.Secondary)], [false]);
export const showMoreButton = buildActionRow([new ButtonBuilder().setCustomId("more").setLabel("Show More").setStyle(ButtonStyle.Success)]);
export const showLessButton = buildActionRow([new ButtonBuilder().setCustomId("less").setLabel("Show Less").setStyle(ButtonStyle.Success)]);

export const previousButton = new ButtonBuilder().setCustomId("previous").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
export const nextButton = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);

export const getUser = (id: string): any => db.prepare("SELECT * FROM users WHERE id = ?").get(id);
export const getServer = (id: string): any => db.prepare("SELECT * FROM servers WHERE id = ?").get(id);
export const getMap = (id: string): any => db.prepare(`SELECT * FROM maps WHERE id = ?`).get(id);
export const insertData = ({ table, id, data }: { table: string; id: string; data: string }): any => db.prepare(`INSERT OR REPLACE INTO ${table} values (?, ?)`).run(id, data);

export class ScoreDetails {
  beatmapId!: number;
  countCircles!: number;
  countSliders!: number;
  countSpinners!: number;
  hitLength!: number;
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
  retries!: number;
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
  ppValue!: string;
  ifFcValue!: string;
  stars!: string;

  static getPerformanceDetails(play: ScoreResponse, rulesetId: number, values: any, mapText: string) {
    const modsId = play.mods.length > 0 ? mods.id(play.mods.join("")) : 0;
    const { count_100, count_300, count_50, count_geki, count_katu, count_miss } = values;

    let scoreParam = {
      mode: rulesetId,
      mods: modsId,
    };
    const map = new Beatmap({ content: mapText });
    const calculator = new Calculator(scoreParam);

    const mapValues = calculator.mapAttributes(map);
    const maxPerf = calculator.performance(map);
    const curPerf = calculator.n300(count_300).n100(count_100).n50(count_50).nMisses(count_miss).combo(play.max_combo).nGeki(count_geki).nKatu(count_katu).performance(map);
    const fcPerf = calculator.n300(count_300).n100(count_100).n50(count_50).nMisses(0).combo(maxPerf.difficulty.maxCombo).nGeki(count_geki).nKatu(count_katu).performance(map);

    return { mapValues, maxPerf, curPerf, fcPerf };
  }

  async initialize(plays: ScoreResponse[], index: number, mode: osuModes) {
    const play = plays[index];
    const rulesetId = rulesets[mode];

    const { id: beatmapId, count_circles, count_sliders, count_spinners, hit_length, version } = play.beatmap;
    const { user_id: creatorId, creator: creatorUsername, status: mapStatus, id: mapsetId, artist, title } = play.beatmapset;
    const { count_100, count_300, count_50, count_geki, count_katu, count_miss } = play.statistics;

    let file = await getMap(beatmapId.toString())?.data;
    if (!file || (mapStatus !== "ranked" && mapStatus !== "loved" && mapStatus !== "approved")) {
      const downloader = new Downloader({
        rootPath: "./cache",
        filesPerSecond: 0,
        synchronous: true,
      });

      downloader.addSingleEntry(
        new DownloadEntry({
          id: beatmapId,
          save: false, // Don't save file on a disk.
        })
      );

      const downloaderResponse = await downloader.downloadSingle();
      if (downloaderResponse.status == -3) {
        throw new Error("ERROR CODE 409, ABORTING TASK");
      }

      file = downloaderResponse.buffer.toString();
      insertData({ table: "maps", id: beatmapId.toString(), data: file });
    }

    const objectshit = count_300 + count_100 + count_50 + count_miss;
    const objects = count_circles + count_sliders + count_spinners;

    const percentageNum = Number((objectshit / objects) * 100);

    this.percentagePassed = percentageNum === 100 || play.passed == true ? "" : `@${percentageNum.toFixed(1)}% `;
    const retryMap = plays.map((x) => x.beatmap.id).splice(0, index);
    const retryCounter = getRetryCount(retryMap, beatmapId) + 1;

    this.modsPlay = play.mods.length > 0 ? `**+${play.mods.join("").toUpperCase()}**` : "**+NM**";

    let hitLength = play.beatmap.hit_length;
    let totalLength = play.beatmap.hit_length;
    if (this.modsPlay.toLowerCase().includes("dt")) {
      hitLength = hitLength / 1.5;
      totalLength = totalLength / 1.5;
    }

    const performance = ScoreDetails.getPerformanceDetails(play, rulesetId, { count_100, count_300, count_50, count_geki, count_katu, count_miss }, file);

    this.beatmapId = beatmapId;
    this.countCircles = count_circles;
    this.countSliders = count_sliders;
    this.countSpinners = count_spinners;
    this.hitLength = hit_length;
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
    this.minutesTotal = Math.floor(totalLength / 60).toFixed();
    this.secondsTotal = (totalLength % 60).toString().padStart(2, "0");
    this.bpm = performance.mapValues.bpm.toFixed();
    this.mapValues = `AR: ${formatNumber(performance.mapValues.ar, 1)} OD: ${formatNumber(performance.mapValues.od, 1)} CS: ${formatNumber(performance.mapValues.cs, 1)} HP: ${formatNumber(performance.mapValues.hp, 2)}`;
    this.stars = performance.maxPerf.difficulty.stars.toFixed(2);

    this.accValues = "";
    if (rulesetId === 0) this.accValues = `{**${count_300}**/${count_100}/${count_50}/${count_miss}}`;
    if (rulesetId === 1) this.accValues = `{**${count_300}**/${count_100}/${count_miss}}`;
    if (rulesetId === 2) this.accValues = `{**${count_300}**/${count_100}/${count_50}/${count_miss}}`;
    if (rulesetId === 3) this.accValues = `{**${count_geki}/${count_300}**/${count_katu}/${count_100}/${count_50}/${count_miss}}`;

    this.ppValue = `**${performance.curPerf.pp.toFixed(2)}**/${performance.curPerf.pp.toFixed(2)}pp [ **${play.max_combo}**x/${performance.maxPerf.difficulty.maxCombo}x ] ${this.accValues}`;
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

      this.ifFcValue = `If FC: **${performance.fcPerf.pp.toFixed(2)}**pp for **${FcAcc.toFixed(2)}%**`;
    }
    return this;
  }

  constructor() {}
}

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

  static async handleRecentButtons(pageBuilder: any, options: any, i: ButtonInteraction, response: Message) {
    const customId = i.customId;

    await i.update({ components: [loadingButtons as any] });
    if (customId === "next") {
      options.index++;
      const page = await pageBuilder(options);

      const _components = [buildActionRow([previousButton, nextButton], [options.index === 0, options.index + 1 === length])];
      response.edit({ embeds: [page], components: _components as any });
    } else if (customId === "previous") {
      options.index--;
      const page = await pageBuilder(options);

      const _components = [buildActionRow([previousButton, nextButton], [options.index === 0, options.index + 1 === length])];
      response.edit({ embeds: [page], components: _components as any });
    }
  }
}

export function getUsernameFromArgs(user: UserDiscord, args?: string[]) {
  args = args || [];

  const flagsParsed = argParser(args.join(" "), flags);

  const argumentString = args.filter((arg) => !flags.includes(arg) || !flags.includes(`-${arg}`)).join(" ");
  if (!argumentString) {
    return { user: getUserData(user.id), flags: flagsParsed };
  }

  const discordUserRegex = /\d{17,18}/;
  const discordUserMatch = argumentString.match(discordUserRegex);
  const userId = discordUserMatch ? discordUserMatch[0] : undefined;

  const discordUser = userId ? { user: getUserData(userId), flags: flagsParsed } : undefined;
  if (discordUser) {
    return discordUser;
  }

  const osuUsernameRegex = /"(.*?)"/;
  const osuUsernameMatch = argumentString.match(osuUsernameRegex);
  const osuUsername = osuUsernameMatch ? osuUsernameMatch[1] : args[0] || undefined;

  return osuUsername ? { user: osuUsername, flags: flagsParsed } : undefined;
}

export function IntearctionHandler(interaction: Message | ChatInputCommandInteraction, args?: string[]) {
  const isSlash = interaction.type === InteractionType.ApplicationCommand;

  const reply = (options: any) => (isSlash ? interaction.editReply(options) : interaction.channel.send(options));
  const userArgs = isSlash ? [interaction.options.getString("user") || ""] : args;
  const author = isSlash ? interaction.user : interaction.author;
  const mode = isSlash ? (interaction.options.getString("mode") as osuModes) || "osu" : "osu";
  const passOnly = isSlash ? interaction.options.getBoolean("passonly") || false : false;

  return { reply, userArgs, author, mode, passOnly };
}
