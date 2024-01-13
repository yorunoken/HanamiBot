import type { modes } from "./osu";

interface BaseUser {
    birthDay?: string;
}

interface SuccessUser extends BaseUser {
    type: "success";
    banchoId: string;
    mode: modes;
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
    name: string | null;
}

export interface ParsedArgs {
    username: Array<string> | null;
    flags: Record<string, string>;
    mods: Mods;
}
