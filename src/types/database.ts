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
    count: string;
}

export interface DatabaseCommands {
    id: string;
    count: string;
}

export enum ScoreEmbed {
    Maximized = 1,
    Minimized = 0
}

