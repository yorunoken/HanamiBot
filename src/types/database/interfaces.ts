// The first item in the export interface is its PRIMARY KEY in the database.

export interface Scores {
    score_id: number;
    user_id: number;
    difficulty_id: number;
    gamemode: string;
    mods: string;
    score: number;
    accuracy: number;
    max_combo: number;
    grade: string;
    count_50: number;
    count_100: number;
    count_300: number;
    count_miss: number;
    count_geki: number;
    count_katu: number;
    map_state: string;
    ended_at: Date;
}

export interface ScoresPP {
    score_id: number;
    pp: number;
    pp_fc: number;
    pp_perfect: number;
}

export interface DiscordUsers {
    discord_id: string;
    bancho_id: string;
    osu_mode: string;
}

export interface DiscordServers {
    server_id: string;
    name: string;
    owner_id: string;
    joined_at: number;
    prefixes: Array<string>;
}

export interface Commands {
    command_name: string;
    count: number;
}

export interface SlashCommands {
    command_name: string;
    count: number;
}
