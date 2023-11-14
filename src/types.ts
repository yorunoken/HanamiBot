export enum PrefixMethods {
  ADD = "add",
  REMOVE = "remove",
  LIST = "list",
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
