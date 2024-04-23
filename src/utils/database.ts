import db from "../data.db" with { type: "sqlite" };
import type { Tables, TableToArgument, TableToType } from "@type/database";

export function query(str: string): unknown {
    return db.prepare(str).all();
}

export function getEntry<T extends Tables>(table: T, id: string | number): TableToType<T> | null {
    const data = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as TableToType<T> | null;
    if (data !== null && "prefixes" in data && typeof data.prefixes === "string")
        data.prefixes = JSON.parse(data.prefixes) as Array<string>;

    return data;
}

export function removeEntry(table: Tables, id: string | number): void {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
}

export function getRowCount(table: Tables): number {
    const count = db.prepare(`SELECT COUNT(*) FROM ${table};`).get() as Record<"COUNT(*)", number>;
    return count["COUNT(*)"];
}

export function insertData<T extends Tables>(
    {
        table,
        id,
        data
    }:
    {
        table: T,
        id: string | number,
        data: Array<{ key: TableToArgument<T>, value: string | number | boolean | null }>
    },
    ignore?: boolean
): void {
    const setClause = data.map((item) => `${item.key} = ?`).join(", ");
    const values: Array<string | number | boolean | null> = data.map((item) => item.value);

    const existingRow = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    if (!existingRow) {
        const fields: Array<TableToArgument<T>> = data.map((item) => item.key);
        const placeholders = fields.map(() => "?").join(", ");

        db.prepare(`INSERT OR ${ignore ? "IGNORE" : "REPLACE"} INTO ${table} (id, ${fields.join(", ")}) values (?, ${placeholders});`)
            .run(id, ...values);
    }

    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?;`)
        .run(...values, id);
}
export function bulkInsertData<T extends Tables>(entries: Array<{
    table: T,
    id: string | number,
    data: Array<{ key: TableToArgument<T>, value: string | number | boolean | null }>,
    ignore?: boolean
}>): void {
    const insertStatements: Array<string> = [];
    const values: Array<Array<string | number | boolean | null>> = [];

    // Map values in their respective arrays
    for (let i = 0; i < entries.length; i++) {
        const { table, id, data, ignore } = entries[i];
        const itemValues: Array<string | number | boolean | null> = data.map((item) => item.value);

        insertStatements.push(`INSERT OR ${ignore ? "IGNORE" : "REPLACE"} INTO ${table} (id, ${data.map((item) => item.key).join(", ")}) values (?, ${data.map(() => "?").join(", ")});`);
        values.push([id, ...itemValues]);
    }

    // Prepare for the bulk insertion.
    db.transaction(() => {
        for (let i = 0; i < insertStatements.length; i++) db.prepare(insertStatements[i]).run(...values[i]);
    })();
}
