import { Message, User } from "discord.js";
import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { MapAttributes, PerformanceAttributes } from "rosu-pp";

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
