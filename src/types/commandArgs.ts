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
