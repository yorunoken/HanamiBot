import type { Mod } from "osu-web.js";
import type { Modes } from "./osu";

interface BaseUser {
    birthDay?: string;
}

interface SuccessUser extends BaseUser {
    type: "success";
    banchoId: string;
    mode: Modes;
}

interface FailUser extends BaseUser {
    type: "fail";
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
