export interface DbUser {
    id: string;
    banchoId: string;
}

export interface DbServer {
    id: string;
    prefixes: string | Array<string> | null;
}

