import BaseEvent from "../Structure/BaseEvent";
import { Database } from "bun:sqlite";
import type { ExtendedClient } from "../Structure";

export const db = new Database("./src/data.db");
const tables = [
    { name: "users", columns: ["id TEXT PRIMARY KEY", "banchoId TEXT"] },
    { name: "servers", columns: ["id INTEGER PRIMARY KEY", "prefix TEXT", "language TEXT"] },
    { name: "maps", columns: ["id INTEGER PRIMARY KEY", "data TEXT"] },
    { name: "commands", columns: ["id TEXT PRIMARY KEY", "count INTEGER"] }
];

interface Columns {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
}

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
console.log("Database up and running!");

export default class ReadyEvent extends BaseEvent {
    public constructor(client: ExtendedClient) {
        super(client);
    }

    public async execute(): Promise<void> {
        if (!this.client.user) return;
        console.log(`Logged in as ${this.client.user.tag}`);
        await this.client.deploy();
    }
}
