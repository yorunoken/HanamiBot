import db from "../data.db" with { type: "sqlite" };
import type { DatabaseMap, DatabaseGuild, DatabaseUser, DatabaseCommands } from "@type/database";

export function getUser(id: string | number): DatabaseUser | null {
    const data: DatabaseUser | null = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as DatabaseUser | null;
    if (typeof data?.score_embeds === "string") data.score_embeds = Number(data.score_embeds);

    return data;
}

export function removeUser(id: string | number): void {
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function getServer(id: string | number): DatabaseGuild | null {
    const data: DatabaseGuild | null = db.prepare("SELECT * FROM servers WHERE id = ?").get(id) as DatabaseGuild | null;
    if (typeof data?.prefixes === "string") data.prefixes = JSON.parse(data.prefixes) as Array<string>;

    return data;
}

export function getRowCount(table: string): number {
    const count = db.prepare(`SELECT COUNT(*) FROM ${table};`).get(table) as Record<"COUNT(*)", number>;
    return count["COUNT(*)"];
}

export function getMap(id: string | number): DatabaseMap | null {
    return db.prepare("SELECT * FROM maps WHERE id = ?").get(id) as DatabaseMap;
}

export function getCommand(id: string | number): DatabaseCommands | null {
    return db.prepare("SELECT * FROM commands WHERE id = ?").get(id) as DatabaseCommands;
}

export function insertData({ table, id, data }: { table: string, id: string | number, data: Array<{ name: string, value: string | number | null }> }): void {
    const setClause = data.map((item) => `${item.name} = ?`).join(", ");
    const values: Array<string | number | null> = data.map((item) => item.value);

    const existingRow = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    if (!existingRow) {
        const fields: Array<string> = data.map((item) => item.name);
        const placeholders = fields.map(() => "?").join(", ");

        db.prepare(`INSERT OR REPLACE INTO ${table} (id, ${fields.join(", ")}) values (?, ${placeholders});`)
            .run(id, ...values);
    }

    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?;`)
        .run(...values, id);
}
