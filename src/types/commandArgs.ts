import type { Mod } from "osu-web.js";
import type { Mode } from "./osu";

export const enum UserType {
    SUCCESS = "success",
    FAIL = "fail"
}

interface BaseUser {
    type: UserType;
    birthDay?: string;
}

interface SuccessUser extends BaseUser {
    type: UserType.SUCCESS;
    banchoId: string;
    mode: Mode;
}

interface FailUser extends BaseUser {
    type: UserType.FAIL;
    failMessage: string;
}

export type User = SuccessUser | FailUser;

export interface CommandArgs {
    user: User;
}

interface Mods {
    include: boolean | null;
    exclude: boolean | null;
    forceInclude: boolean | null;
    name: Mod | null;
}

export interface ParsedArgs {
    tempUserDoNotUse: Array<string> | null;
    user: User;
    flags: Record<string, string | undefined>;
    mods: Mods;
}
