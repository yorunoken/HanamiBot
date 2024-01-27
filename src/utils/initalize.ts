import db from "../data.db" with { type: "sqlite" };
import { readdir } from "fs/promises";
import type { DefaultMessageCommands } from "../types/commands";

export const messageCommands = new Map<string, DefaultMessageCommands>();
export const commandAliases = new Map<string, string>();

export async function loadMessageCommands(): Promise<void> {
    // Temporary array to store promises of MessageCommands
    const temp: Array<Promise<DefaultMessageCommands>> = [];

    const cmds = await readdir("./src/commands-message");
    for (const cmd of cmds) {
        const command = import(`../commands-message/${cmd}`) as Promise<DefaultMessageCommands>;
        temp.push(command);
    }

    const commands = await Promise.all(temp);
    for (const command of commands) {
        const { default: cmd } = command;

        // Add the command to the command map
        messageCommands.set(cmd.name, command);

        // Check if the command has aliases and add them to the command map
        if (cmd.aliases && cmd.aliases.length > 0 && Array.isArray(cmd.aliases)) {
            cmd.aliases.forEach((alias) => {
                commandAliases.set(alias, cmd.name);
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

    for (const table of tables) {
        // Create the Databases if they don't exist
        db.run(`CREATE TABLE IF NOT EXISTS ${table.name} (${table.columns.join(", ")});`);

        //  Get all of the existing databases
        const existingColumns = db.prepare(`PRAGMA table_info(${table.name});`).all() as Array<Columns>;

        // Loop through Columns and add/remove them
        for (const columnNameType of table.columns) {
            const [columnName] = columnNameType.split(" ");

            const columnExists = existingColumns.some((col) => col.name === columnName);

            if (!columnExists) {
                db.run(`ALTER TABLE ${table.name} ADD COLUMN ${columnNameType};`);
                console.log(`Added column ${columnName} in ${table.name} table`);
            }
        }

        for (const col of existingColumns) {
            const columnName = col.name;
            const columnNotInTables = !table.columns.some((colType) => colType.startsWith(columnName));

            if (columnNotInTables) {
                db.run(`ALTER TABLE ${table.name} DROP COLUMN ${columnName};`);
                console.log(`Removed column ${columnName} from ${table.name}`);
            }
        }
    }

    console.log("Database up and running!");
}

