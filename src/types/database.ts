export interface DbUser {
    id: string;
    banchoId: string | null;
    score_embeds: number | null;
    mode: string | null;
}

export interface DbServer {
    id: string;
    prefixes: Array<string> | string | null;
}

export interface DbMap {
    id: string;
    data: string;
}

export enum ScoreEmbed {
    Maximized = 1,
    Minimized = 0
}

