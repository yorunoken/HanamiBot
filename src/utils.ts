import { db } from ".";
import type { DbUser } from "./types/database";

interface Columns {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
}

export function initializeDatabase(): void {
    const tables = [ { name: "users", columns: ["id TEXT PRIMARY KEY", "banchoId TEXT"] } ];

    tables.forEach((table) => {
        db.run(`CREATE TABLE IF NOT EXISTS ${table.name} (${table.columns.join(", ")});`);
        const existingColumns = db.prepare(`PRAGMA table_info(${table.name});`).all() as Array<Columns>;

        table.columns.forEach((columnNameType) => {
            const [columnName] = columnNameType.split(" ");

            const columnExists = existingColumns.some((col) => col.name === columnName);

            if (!columnExists) {
                console.log(`Added column ${columnName} in ${table.name} table`);
                db.run(`ALTER TABLE ${table.name} ADD COLUMN ${columnNameType};`);
            }
        });

        existingColumns.forEach((col) => {
            const columnName = col.name;
            const columnNotInTables = !table.columns.some((colType) => colType.startsWith(columnName));

            if (columnNotInTables) {
                console.log(`Removed column ${columnName} from ${table.name}`);
                db.run(`ALTER TABLE ${table.name} DROP COLUMN ${columnName};`);
            }
        });
    });
}

export function getUser(id: string | number): DbUser | undefined {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser;
}

export function insertData({ table, id, data }: { table: string, id: string | number, data: Array<{ name: string, value: string | number }> }): void {
    const fields: Array<string> = data.map((item) => item.name);
    const values: Array<string | number | null> = data.map((item) => item.value);

    db.prepare(`INSERT OR REPLACE INTO ${table} (id, ${fields.join(", ")}) values (?, ${fields.map(() => "?").join(", ")})`)
        .run(id, ...values);
}
