import { User, Message } from "discord.js";

export enum PrefixMethods {
  ADD = "add",
  REMOVE = "remove",
  LIST = "list",
}

export enum commands {
  Recent = 0,
  Top = 1,
  Leaderboard = 2,
}

export interface commandInterface {
  initializer: User;
  buttonHandler?: "handleProfileButtons" | "handleRecentButtons" | "handleTopsButtons";
  type: commands;
  embedOptions: object;
  response: Message;
  pageBuilder: Function;
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
