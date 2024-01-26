import { setMapData } from "../listeners/ready";
import db from "../data.db" with { type: "sqlite" };
import { getServer, insertData } from "./database";
import { readdir } from "fs/promises";
import type { Client } from "lilybird";
import type { MessageCommands } from "../types/commands";

export async function loadMessageCommands(): Promise<void> {
    // Temporary array to store promises of MessageCommands
    const temp: Array<Promise<MessageCommands>> = [];

    const items = await readdir("./src/commands-message", { recursive: true });
    for (const item of items) {
        // Split the path into category and command
        const [category, cmd] = item.split("/");
        if (!category || !cmd) continue; // Skip if category or command is missing

        const command = import(`../commands-message/${category}/${cmd}`) as Promise<MessageCommands>;
        temp.push(command);
    }

    const commands = await Promise.all(temp);
    for (const command of commands) {
        // Add the command to the command map
        setMapData(false, command.name, command);

        // Check if the command has aliases and add them to the command map
        if (command.aliases.length > 0 && Array.isArray(command.aliases)) {
            command.aliases.forEach((alias) => {
                setMapData(true, alias, command.name);
            });
        }
    }
}

interface Columns {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
}

export function initializeDatabase(): void {
    const tables = [
        { name: "users", columns: ["id TEXT PRIMARY KEY", "banchoId TEXT"] },
        { name: "servers", columns: ["id TEXT PRIMARY KEY", "prefixes TEXT"] }
    ];

    // I promise I will make this prettier
    tables.forEach((table) => {
        db.run(`CREATE TABLE IF NOT EXISTS ${table.name} (${table.columns.join(", ")});`);
        const existingColumns = db.prepare(`PRAGMA table_info(${table.name});`).all() as Array<Columns>;

        table.columns.forEach((columnNameType) => {
            const [columnName] = columnNameType.split(" ");

            const columnExists = existingColumns.some((col) => col.name === columnName);

            if (!columnExists) {
                db.run(`ALTER TABLE ${table.name} ADD COLUMN ${columnNameType};`);
                console.log(`Added column ${columnName} in ${table.name} table`);
            }
        });

        existingColumns.forEach((col) => {
            const columnName = col.name;
            const columnNotInTables = !table.columns.some((colType) => colType.startsWith(columnName));

            if (columnNotInTables) {
                db.run(`ALTER TABLE ${table.name} DROP COLUMN ${columnName};`);
                console.log(`Removed column ${columnName} from ${table.name}`);
            }
        });
    });

    console.log("Database up and running!");
}

export function checkServers(client?: Client, guildsId?: Array<string | number>): void {
    if (client)
        guildsId = Array.from(client.guilds.keys());

    if (!guildsId) return;

    for (const guildId of guildsId) {
        const document = getServer(guildId);
        if (!document)
            insertData({ table: "servers", id: guildId, data: [ { name: "prefixes", value: null } ] });
    }
}

