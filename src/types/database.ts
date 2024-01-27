export interface DbUser {
    id: string;
    banchoId: string;
}

export interface DbServer {
    id: string;
    prefixes: Array<string> | string | null;
}

