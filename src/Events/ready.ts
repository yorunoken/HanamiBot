import BaseEvent from "../Structure/BaseEvent";
import { Database } from "bun:sqlite";
import type { ExtendedClient } from "../Structure";

export const db = new Database("./src/data.db");
const tables = [
    { name: "users", columns: ["id TEXT PRIMARY KEY", "banchoId TEXT"] },
    { name: "servers", columns: ["id INTEGER PRIMARY KEY", "prefix TEXT", "language TEXT"] },
    { name: "maps", columns: ["id INTEGER PRIMARY KEY", "data TEXT"] },
    { name: "commands", columns: ["name TEXT PRIMARY KEY", "count INTEGER"] }
];

tables.forEach((table) => {
    db.run(`CREATE TABLE IF NOT EXISTS ${table.name} (${table.columns.join(", ")});`);
    table.columns.forEach((column) => {
        console.log(`ALTER TABLE ${table.name} ADD COLUMN IF NOT EXISTS ${column};`);
        db.run(`ALTER TABLE ${table.name} ADD COLUMN IF NOT EXISTS ${column};`);
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
