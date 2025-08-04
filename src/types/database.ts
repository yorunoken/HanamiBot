import type { Mode } from "./osu";

export enum Tables {
    USER = "users",
    GUILD = "guilds",
    MAP = "maps",
    COMMAND = "commands",
    COMMAND_SLASH = "commands_slash",
    SCORE = "osu_scores",
    PP = "osu_scores_pp",
}

export enum EmbedScoreType {
    Hanami = "hanami",
    Bathbot = "bathbot",
    Owo = "owobot",
}

export interface User {
    id: string;
    banchoId: string | null;
    score_embeds: number | null;
    embed_type: EmbedScoreType | null;
    mode: string | null;
}

export interface Guild {
    id: string;
    name: string;
    owner_id: string;
    joined_at: string;
    prefixes: Array<string> | null;
}

export interface Map {
    id: string;
    data: string;
}

export interface Command {
    id: string;
    count: string | null;
}

export interface Score {
    id: number;
    user_id: number;
    map_id: number;
    gamemode: Mode;
    mods: string;
    score: number;
    accuracy: number;
    max_combo: number;
    grade: string;
    count_50: number;
    count_100: number;
    count_300: number;
    count_miss: number;
    count_geki: number;
    count_katu: number;
    map_state: "ranked" | "graveyard" | "wip" | "pending" | "approved" | "qualified" | "loved";
    ended_at: string;
}

export interface ScorePp {
    id: number;
    pp: number;
    pp_fc: number;
    pp_perfect: number;
}

export enum ScoreEmbed {
    Maximized = 1,
    Minimized = 0,
}

export type TableToArgument<T extends Tables> = T extends "users"
    ? keyof User
    : T extends "guilds"
      ? keyof Guild
      : T extends "maps"
        ? keyof Map
        : T extends "commands"
          ? keyof Command
          : T extends "commands_slash"
            ? keyof Command
            : T extends "osu_scores"
              ? keyof Score
              : T extends "osu_scores_pp"
                ? keyof ScorePp
                : never;

export type TableToType<T extends Tables> = T extends "users"
    ? User
    : T extends "guilds"
      ? Guild
      : T extends "maps"
        ? Map
        : T extends "commands"
          ? Command
          : T extends "commands_slash"
            ? Command
            : T extends "osu_scores"
              ? Score
              : T extends "osu_scores_pp"
                ? ScorePp
                : never;
