import db from "../data.db" with { type: "sqlite" };
import type { DbMap, DbServer, DbUser } from "../types/database";

export function getUser(id: string | number): DbUser | undefined {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser;
}

export function removeUser(id: string | number): void {
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function getServer(id: string | number): DbServer | undefined {
    return db.prepare("SELECT * FROM servers WHERE id = ?").get(id) as DbServer;
}

export function getMap(id: string | number): DbMap | undefined {
    return db.prepare("SELECT * FROM maps WHERE id = ?").get(id) as DbMap;
}

export function insertData({ table, id, data }: { table: string, id: string | number, data: Array<{ name: string, value: string | number | null }> }): void {
    const fields: Array<string> = data.map((item) => item.name);
    const values: Array<string | number | null> = data.map((item) => item.value);

    db.prepare(`INSERT OR REPLACE INTO ${table} (id, ${fields.join(", ")}) values (?, ${fields.map(() => "?").join(", ")})`)
        .run(id, ...values);
}
