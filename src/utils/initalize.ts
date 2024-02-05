import db from "../data.db" with { type: "sqlite" };
import { getAccessToken } from "./osu";
import { Client as OsuClient } from "osu-web.js";
import { readdir } from "fs/promises";
import type { Client as LilybirdClient, POSTApplicationCommandStructure } from "lilybird";
import type { DefaultMessageCommand, DefaultSlashCommand } from "../types/commands";

const access = await getAccessToken(+process.env.CLIENT_ID, process.env.CLIENT_SECRET, ["public"]);
export const client = new OsuClient(access.access_token);

export const messageCommands = new Map<string, DefaultMessageCommand>();
export const commandAliases = new Map<string, string>();
export const applicationCommands = new Map<string, DefaultSlashCommand>();

export async function loadMessageCommands(): Promise<void> {
    // Temporary array to store promises of MessageCommands
    const temp: Array<Promise<DefaultMessageCommand>> = [];

    const items = await readdir("./src/commands-message", { recursive: true });
    for (const item of items) {
        const [category, cmd] = item.split("/");
        if (!category || !cmd) continue;

        const command = import(`../commands-message/${category}/${cmd}`) as Promise<DefaultMessageCommand>;
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

export async function loadApplicationCommands(clnt: LilybirdClient): Promise<void> {
    const slashCommands: Array<POSTApplicationCommandStructure> = [];
    const temp: Array<Promise<DefaultSlashCommand>> = [];

    const items = await readdir("./src/commands", { recursive: true });
    for (const item of items) {
        const [category, cmd] = item.split("/");
        if (!category || !cmd) continue;
        if (category === "data") continue;

        const command = import(`../commands/${category}/${cmd}`) as Promise<DefaultSlashCommand>;
        temp.push(command);
    }

    const commands = await Promise.all(temp);
    for (const command of commands) {
        const { default: cmd } = command;
        slashCommands.push(cmd.data);
        applicationCommands.set(cmd.data.name, command);
    }

    const { rest } = clnt;
    await rest.bulkOverwriteGlobalApplicationCommand(clnt.user.id, slashCommands);
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
        { name: "servers", columns: ["id TEXT PRIMARY KEY", "prefixes TEXT"] },
        { name: "maps", columns: ["id TEXT PRIMARY KEY", "data TEXT"] }
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

