export interface DbUser {
    id: string;
    banchoId: string;
}

export interface DbServer {
    id: string;
    prefixes: Array<string> | string | null;
}

export interface DbMap {
    id: string;
    data: string;
}

