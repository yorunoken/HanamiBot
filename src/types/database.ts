export enum EmbedScoreType {
    Hanami = "hanami",
    Bathbot = "bathbot",
    Owo = "owobot"
}

export interface DatabaseUser {
    id: string;
    banchoId: string | null;
    score_embeds: number | null;
    embed_type: EmbedScoreType | null;
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

export interface DatabaseCommands {
    id: string;
    count: string | null;
}

export enum ScoreEmbed {
    Maximized = 1,
    Minimized = 0
}

