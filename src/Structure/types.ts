import { Message, SlashCommandBuilder, User } from "discord.js";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { MapAttributes, PerformanceAttributes } from "rosu-pp";

export interface PrefixCommands {
  name: string;
  aliases: string;
  cooldown: number;
  description: string;
  run: (options: { [key: string]: any }) => Promise<void>;
}

export interface SlashCommands {
  run: (options: { [key: string]: any }) => Promise<void>;
  data: SlashCommandBuilder;
}

export enum PrefixMethods {
  ADD = "add",
  REMOVE = "remove",
  LIST = "list",
}

export enum commands {
  Recent = 0,
  Top = 1,
  Profile = 2,
}

export interface commandInterface {
  initializer: User;
  buttonHandler?: "handleProfileButtons" | "handleRecentButtons" | "handleTopsButtons";
  type: commands;
  embedOptions: any;
  response: Message;
  pageBuilder?: Function;
}

export type CallbackVoid = (value?: any) => void;
export type osuModes = "osu" | "mania" | "fruits" | "taiko";
export type tables = "maps" | "servers" | "users";

export interface ModuleReturn {
  __esModule: boolean;
  aliases: string[];
  cooldown: number;
  description: string;
  flags: string;
  name: string;
  run: Function;
}

export interface BeatmapInfo {
  title: string;
  artist: string;
  version: string;
  mode: string;
  id: number;
  setId: number;
  creator: string;
  rulesetId: number;
  totalObjects: number;
  stars: string;
  mods: string;
  bpm: string;
  totalLength: string | number;
  mapLength: string;
  maxCombo: number;
  ar: string;
  od: string;
  hp: string;
  cs: string;
  favorited: string;
  playCount: string;
  ppValues: string;
  links: string;
  background: string;
  updatedAt: string;
  modeEmoji: string;
}

export interface ScoreInfo {
  performance: any;
  retries?: number;
  percentagePassed: string | "";
  modsPlay: string;
  beatmapId: number;
  globalPlacement: string;
  countCircles: number;
  countSliders: number;
  countSpinners: number;
  hitLength: number;
  placement: number;
  version: string;
  creatorId: number;
  creatorUsername: string;
  mapStatus: string;
  mapsetId: number;
  count100: number;
  count300: number;
  count50: number;
  countGeki: number;
  countKatu: number;
  countMiss: number;
  totalScore: string;
  accuracy: string;
  artist: string;
  title: string;
  grade: string;
  submittedTime: number;
  minutesTotal: string;
  secondsTotal: string;
  bpm: string;
  mapValues: string;
  stars: string;
  accValues: string;
  comboValue: string;
  pp: string | undefined;
  fcPp: string;
  ssPp: string;
  totalResult: string;
  ifFcValue: string;
}

export interface UserInfo {
  locale: Locales;
  username: string;
  userCover: string;
  userAvatar: string;
  userUrl: string;
  coverUrl: string;
  userFlag: string;
  countryCode: string;
  globalRank: string;
  countryRank: string;
  pp: string;
  rankedScore: string;
  totalScore: string;
  objectsHit: string;
  occupation: string;
  interest: string;
  location: string;
  highestRank?: string;
  highestRankTime?: number;
  recommendedStarRating: string;
  userJoinedAgo: string;
  formattedDate: string;
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
}

export interface noChokePlayDetails {
  mapValues: MapAttributes;
  maxPerf: PerformanceAttributes;
  curPerf: PerformanceAttributes | undefined;
  fcPerf: PerformanceAttributes;
  mapId: number;
  playInfo: {
    play: ScoreResponse;
    misses: number;
    grade: string;
  };
}

interface Embeds {
  page: string;
  otherPlays: string;
  provideUsername: string;
  help: {
    title: string;
    commandNotFound: string;
    commandInfoTitleEmbed: string;
  };
  leaderboard: {
    noScores: string;
    global: string;
    country: string;
    type: string;
    userScore: string;
  };
  map: {
    beatmapBy: string;
    stars: string;
    mods: string;
    length: string;
    maxCombo: string;
    objects: string;
    links: string;
    ranked: string;
    loved: string;
    qualified: string;
    pending: string;
    graveyard: string;
  };
  link: {
    success: string;
  };
  plays: {
    top: string;
    recent: string;
    noScores: string;
    playsFound: string;
    try: string;
    length: string;
    mapper: string;
  };
  whatif: {
    count: string;
    plural: string;
    samePp: string;
    title: string;
    description: string;
  };
  profile: {
    peakRank: string;
    achieved: string;
    statistics: string;
    accuracy: string;
    level: string;
    playcount: string;
    followers: string;
    maxCombo: string;
    recommendedStars: string;
    grades: string;
    joinDate: string;
    score: string;
    rankedScore: string;
    totalScore: string;
    objectsHit: string;
    profile: string;
  };
  nochoke: {
    alreadyDownloading: string;
    mapsArentInDb: string;
    mapsDownloaded: string;
    approximateRank: string;
  };
}

interface Classes {
  occupation: string;
  interests: string;
  location: string;
  globalRank: string;
  ifFc: string;
  songPreview: string;
  mapPreview: string;
  fullBackground: string;
  ranked: string;
  loved: string;
  qualified: string;
  updatedAt: string;
}

interface Fails {
  languageDoesntExist: string;
  channelDoesntExist: string;
  linkFail: string;
  userDoesntExist: string;
  userHasNoScores: string;
  provideValidPage: string;
  noLeaderboard: string;
  noBeatmapIdInCtx: string;
  error: string;
  interactionError: string;
  cooldownTime: string;
  userButtonNotAllowed: string;
}

interface Modals {
  enterValue: string;
  valueInsert: string;
}

interface Misc {
  success: string;
  warning: string;
  poweredBy: string;
  feedbackSent: string;
  languageSet: string;
}

export interface Locales {
  code: string;
  embeds: Embeds;
  classes: Classes;
  fails: Fails;
  modals: Modals;
  misc: Misc;
}
