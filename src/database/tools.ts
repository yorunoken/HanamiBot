import discordDb from "./discord.db" with { type: "sqlite" };
import osuDb from "./osu.db" with { type: "sqlite" };
import { Tables } from "types/database/enums";
import { TableColumnKeys, TableEntityType } from "types/database/types";

function getDatabase(table: Tables) {
    switch (table) {
        case Tables.SCORES:
        case Tables.SCORES_PP:
            return osuDb;
        case Tables.USERS:
        case Tables.SERVERS:
        case Tables.COMMANDS:
        case Tables.SLASH_COMMANDS:
            return discordDb;
        default:
            throw new Error(`Unknown table: ${table}`);
    }
}

function getPrimaryKeyField<T extends Tables>(table: T): string {
    switch (table) {
        case Tables.SCORES:
            return "score_id"; // as keyof TableEntityType<T>;
        case Tables.SCORES_PP:
            return "score_id"; // as keyof TableEntityType<T>;
        case Tables.USERS:
            return "discord_id"; // as keyof TableEntityType<T>;
        case Tables.SERVERS:
            return "server_id"; // as keyof TableEntityType<T>;
        case Tables.COMMANDS:
            return "command_name"; // as keyof TableEntityType<T>;
        case Tables.SLASH_COMMANDS:
            return "command_name"; // as keyof TableEntityType<T>;
        default:
            throw new Error(`Unknown table: ${table}`);
    }
}

export function getEntry<T extends Tables>(table: T, id: string | number): TableEntityType<T> | null {
    const db = getDatabase(table);
    const primaryKeyField = getPrimaryKeyField(table);

    const data = db.prepare(`SELECT * FROM ${table} WHERE ${primaryKeyField} = ?;`).get(id) as TableEntityType<T> | null;
    if (data !== null && "prefixes" in data) data.prefixes = JSON.parse(data.prefixes.toString());

    return data;
}

export function removeEntry(table: Tables, id: string | number): void {
    const db = getDatabase(table);
    const primaryKeyField = getPrimaryKeyField(table);

    db.prepare(`DELETE FROM ${table} WHERE ${primaryKeyField} = ?;`).run(id);
}

export function getRowCount(table: Tables): number {
    const db = getDatabase(table);
    const qr = db.prepare(`SELECT COUNT(*) as count FROM ${table};`).get() as { count: number | null };
    return qr.count ?? 0;
}

export function getRowSum(table: Tables): number {
    const db = getDatabase(table);
    const qr = db.prepare(`SELECT SUM(count) AS sum FROM ${table};`).get() as { sum: number | null };
    return qr.sum ?? 0;
}

export function insertData<T extends Tables>(
    {
        table,
        id,
        data,
    }: {
        table: T;
        id: string | number;
        data: Array<{ key: TableColumnKeys<T>; value: string | number | boolean | null }>;
    },
    ignore?: boolean,
): void {
    const db = getDatabase(table);
    const primaryKeyField = getPrimaryKeyField(table);

    const setClause = data.map((item) => `${item.key} = ?`).join(", ");
    const values: Array<string | number | boolean | null> = data.map((item) => item.value);

    const existingRow = db.prepare(`SELECT * FROM ${table} WHERE ${primaryKeyField} = ?`).get(id);
    if (!existingRow) {
        const fields: Array<TableColumnKeys<T>> = data.map((item) => item.key);
        const placeholders = fields.map(() => "?").join(", ");

        db.prepare(`INSERT OR ${ignore ? "IGNORE" : "REPLACE"} INTO ${table} (${primaryKeyField}, ${fields.join(", ")}) values (?, ${placeholders});`).run(id, ...values);
    }

    db.prepare(`UPDATE ${table} SET ${setClause} WHERE ${primaryKeyField} = ?;`).run(...values, id);
}
