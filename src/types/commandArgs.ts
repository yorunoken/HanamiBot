interface BaseUser {
    birthDay?: string;
}

interface SuccessUser extends BaseUser {
    type: "success";
    banchoId: string;
    mode: string;
}

interface FailUser extends BaseUser {
    type: "fail";
    failMessage: string;
}

export type User = SuccessUser | FailUser;

export interface CommandArgs {
    user: User;
}
