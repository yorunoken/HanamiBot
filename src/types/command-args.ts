import type { User as UserDb } from "./database";
import type { Mod } from "osu-web.js";
import type { Mode } from "./osu";

export const enum UserType {
    SUCCESS = "success",
    FAIL = "fail",
}

interface BaseUser {
    type: UserType;
    authorDb: UserDb | null;
    playerDb?: UserDb | null;
    beatmapId: string | null;
}

export interface SuccessUser extends BaseUser {
    type: UserType.SUCCESS;
    banchoId: string;
    mode: Mode;
}

export interface FailUser extends BaseUser {
    type: UserType.FAIL;
    failMessage: string;
}

export interface DifficultyOptions {
    combo?: number;
    acc?: number;
    clock_rate?: number;
    bpm?: number;
    n300?: number;
    n100?: number;
    n50?: number;
    nmisses?: number;
    ngeki?: number;
    nkatu?: number;
    ar?: number;
    od?: number;
    cs?: number;
}

export type User = SuccessUser | FailUser;

export interface SlashCommandArgs {
    user: User;
    mods: Mods;
    difficultySettings?: DifficultyOptions;
}

export interface Mods {
    include: boolean | null;
    exclude: boolean | null;
    forceInclude: boolean | null;
    name: Mod | null;
}

export interface PrefixCommandArgs {
    tempUser: Array<string> | null;
    user: User;
    flags: Record<string, string | undefined>;
    mods: Mods;
}
