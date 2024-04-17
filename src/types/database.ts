import type { Mode } from "./osu";

export enum EmbedScoreType {
    Hanami = "hanami",
    Bathbot = "bathbot",
    Owo = "owobot"
}

export interface DatabaseUser {
    id: string;
    banchoId: string | null;
    score_embeds: number | null;
    embed_type: EmbedScoreType | null;
    mode: string | null;
}

export interface DatabaseGuild {
    id: string;
    name: string;
    owner_id: string;
    joined_at: string;
    prefixes: Array<string> | null;
}

export interface DatabaseMap {
    id: string;
    data: string;
}

export interface DatabaseCommands {
    id: string;
    count: string | null;
}

export interface DatabaseScores {
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

export interface DatabaseScoresPp {
    score_id: number;
    pp: number;
    pp_fc: number;
    pp_perfect: number;
}

export enum ScoreEmbed {
    Maximized = 1,
    Minimized = 0
}

