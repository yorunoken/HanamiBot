import db from "../data.db" with { type: "sqlite" };
import { getAccessToken } from "./osu";
import { slashCommandsIds } from "./cache";
import { Client as OsuClient } from "osu-web.js";
import { mkdir, access, readFile, writeFile, readdir } from "node:fs/promises";
import type { Client as LilybirdClient, POSTApplicationCommandStructure } from "lilybird";
import type { DefaultMessageCommand, DefaultSlashCommand } from "@type/commands";

const { accessToken } = await getAccessToken(+process.env.CLIENT_ID, process.env.CLIENT_SECRET, ["public"]);
export const client = new OsuClient(accessToken);

export const messageCommands = new Map<string, DefaultMessageCommand>();
export const commandAliases = new Map<string, string>();
export const applicationCommands = new Map<string, DefaultSlashCommand>();

export async function loadMessageCommands(): Promise<void> {
    // Temporary array to store promises of MessageCommands
    const temp: Array<Promise<DefaultMessageCommand>> = [];

    const items = await readdir("./src/commands-message", { recursive: true });
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const [category, cmd] = item.split(process.platform === "win32" ? "\\" : "/");
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
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const [category, cmd] = item.split(process.platform === "win32" ? "\\" : "/");
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

    const commandsIds = await clnt.rest.bulkOverwriteGlobalApplicationCommand(clnt.user.id, slashCommands);
    for (const command of commandsIds) {
        const { name, id } = command;
        slashCommandsIds.set(name, `</${name}:${id}>`);
    }
}

async function exists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch (e) {
        return false;
    }
}

export async function loadLogs(message: string, error?: boolean): Promise<void> {
    const date = new Date(Date.now());
    const formattedDate = `${new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC"
    }).format(date)}  |  `;

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    const year = date.getFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const monthName = monthNames[date.getUTCMonth()];
    const day = date.getUTCDate().toString().padStart(2, "0");

    if (!await exists("./logs")) {
        console.log("The logs folder couldn't be found❌, generating..");
        await mkdir("./logs", { recursive: true });
    }

    if (!await exists(`./logs/${year}`)) {
        console.log(`The year ${year} couldn't be found❌, generating..`);
        await mkdir(`./logs/${year}`, { recursive: true });
    }

    if (!await exists(`./logs/${year}/${month}`)) {
        console.log(`The month ${monthName}(${month}) couldn't be found❌, generating..`);
        await mkdir(`./logs/${year}/${month}`, { recursive: true });
    }

    if (!await exists(`./logs/${year}/${month}/${day}.txt`)) {
        console.log(`The day ${day} couldn't be found ❌, generating..`);
        await writeFile(`./logs/${year}/${month}/${day}.txt`, `${formattedDate}Created log file.`);
    } else {
        const todaysLogFile = await readFile(`./logs/${year}/${month}/${day}.txt`, "utf-8");
        await writeFile(`./logs/${year}/${month}/${day}.txt`, `${todaysLogFile}\n${formattedDate}${message}`);
        console[error ? "error" : "log"](`${formattedDate}${message}`);
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
        { name: "users", columns: ["id TEXT PRIMARY KEY", "banchoId TEXT", "score_embeds INTEGER", "mode TEXT"] },
        { name: "servers", columns: ["id TEXT PRIMARY KEY", "prefixes TEXT"] },
        { name: "maps", columns: ["id TEXT PRIMARY KEY", "data TEXT"] },
        { name: "commands", columns: ["id TEXT PRIMARY KEY", "count TEXT"] },
        { name: "commands_slash", columns: ["id TEXT PRIMARY KEY", "count TEXT"] }
    ];

    for (const table of tables) {
        // Create the Databases if they don't exist
        db.run(`CREATE TABLE IF NOT EXISTS ${table.name} (${table.columns.join(", ")});`);

        //  Get all of the existing databases
        const existingColumns = <Array<Columns>>db.prepare(`PRAGMA table_info(${table.name});`).all();

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

