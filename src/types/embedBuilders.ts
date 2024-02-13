import type { Leaderboard, Mode } from "./osu";
import type { UserExtended, Mod, Score, Beatmap } from "osu-web.js";

export const enum EmbedBuilderType {
    COMPARE = "compareBuilder",
    LEADERBOARD = "leaderboardBuilder",
    MAP = "mapBuilder",
    PLAYS = "playBuilder",
    PROFILE = "profileBuilder"
}

export interface CompareBuilderOptions {
    builderType: EmbedBuilderType.COMPARE;
    beatmap: Beatmap;
    plays: Array<Score>;
    user: UserExtended;
    mode: Mode;
    beatmapId: number;
    mods?: {
        exclude: null | boolean,
        include: null | boolean,
        forceInclude: null | boolean,
        name: null | Mod
    };
}

export interface LeaderboardBuilderOptions {
    builderType: EmbedBuilderType.LEADERBOARD;
    type: Leaderboard;
    beatmapId: number;
    mods?: {
        exclude: null | boolean,
        include: null | boolean,
        forceInclude: null | boolean,
        name: null | Mod
    };
    page: number | undefined;
    isMaxValue?: boolean;
    isMinValue?: boolean;
}

export interface MapBuilderOptions { builderType: EmbedBuilderType.MAP; beatmapId: number; mods: Array<Mod> | null }

export interface PlaysBuilderOptions {
    builderType: EmbedBuilderType.PLAYS;
    user: UserExtended;
    mode: Mode;
    type: "best" | "firsts" | "recent";
    index?: number;
    initiatorId: string;
    includeFails?: boolean;
    mods?: {
        exclude: null | boolean,
        include: null | boolean,
        forceInclude: null | boolean,
        name: null | Mod
    };
    isMultiple?: boolean;
    sortByDate?: boolean;
    page?: number;
    isMaxValue?: boolean;
    isMinValue?: boolean;
}

export interface ProfileBuilderOptions { builderType: EmbedBuilderType.PROFILE; user: UserExtended; mode: Mode }

export type EmbedBuilderOptions = CompareBuilderOptions | LeaderboardBuilderOptions | MapBuilderOptions | PlaysBuilderOptions | ProfileBuilderOptions;
