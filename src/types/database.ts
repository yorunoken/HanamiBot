export interface DatabaseUser {
    id: string;
    banchoId: string | null;
    score_embeds: number | null;
    mode: string | null;
}

export interface DatabaseGuild {
    id: string;
    prefixes: Array<string> | null;
}

export interface DatabaseMap {
    id: string;
    data: string;
}

export enum ScoreEmbed {
    Maximized = 1,
    Minimized = 0
}

