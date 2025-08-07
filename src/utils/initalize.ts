import db from "../../data.db" with { type: "sqlite" };
import { getAccessToken } from "./osu";
import { removeEntry } from "./database";
import { guildPrefixesCache, messageCommandsCache, slashCommandIdsCache, commandAliasesCache, applicationCommandsCache } from "./cache";
import { logger } from "./logger";
import { Tables } from "@type/database";
import { Client as OsuClient } from "osu-web.js";
import { readdir } from "fs/promises";
import type { Guild } from "@type/database";
import type { DefaultMessageCommand, DefaultSlashCommand } from "@type/commands";
import { LilyClient, ApplicationCommand } from "lilybird";

const tokenResult = await getAccessToken(+process.env.CLIENT_ID, process.env.CLIENT_SECRET, ["public"]);
if (!tokenResult) {
    throw new Error("Failed to get initial access token");
}
const { accessToken } = tokenResult;
export const client = new OsuClient(accessToken);

export async function loadMessageCommands(): Promise<void> {
    // Temporary array to store promises of MessageCommands
    const temp: Array<Promise<DefaultMessageCommand>> = [];

    const items = await readdir("./src/commands/message", { recursive: true });
    for (const item of items) {
        const [category, cmd] = item.split(process.platform === "win32" ? "\\" : "/");
        if (!category || !cmd) continue;

        const command = import(`../commands/message/${category}/${cmd}`) as Promise<DefaultMessageCommand>;
        temp.push(command);
    }

    const commands = await Promise.all(temp);
    for (const command of commands) {
        const { default: cmd } = command;

        // Add the command to the command map
        messageCommandsCache.set(cmd.name, command);

        const { aliases } = cmd;
        // Check if the command has aliases and add them to the command map
        if (aliases && aliases.length > 0 && Array.isArray(aliases)) {
            for (const alias of aliases) {
                commandAliasesCache.set(alias, cmd.name);
            }
        }
    }
}

export async function loadApplicationCommands(lilyClient: LilyClient): Promise<void> {
    const slashCommands: Array<ApplicationCommand.Create.ApplicationCommandJSONParams> = [];
    const temp: Array<Promise<DefaultSlashCommand>> = [];

    const items = await readdir("./src/commands/application", { recursive: true });
    for (const item of items) {
        const [category, cmd] = item.split(process.platform === "win32" ? "\\" : "/");
        if (!category || !cmd) continue;
        if (category === "data") continue;

        const command = import(`../commands/application/${category}/${cmd}`) as Promise<DefaultSlashCommand>;
        temp.push(command);
    }

    const commands = await Promise.all(temp);
    for (const command of commands) {
        const { default: cmd } = command;
        slashCommands.push(cmd.data);
        applicationCommandsCache.set(cmd.data.name, command);
    }

    let commandIds: Array<ApplicationCommand.Localizations.GlobalStructure>;
    if (process.env.DEV) {
        logger.info("Processing commands as Development.");
        commandIds = await lilyClient.rest.bulkOverwriteGlobalApplicationCommand(lilyClient.user.id, slashCommands);
    } else {
        commandIds = await lilyClient.rest.bulkOverwriteGlobalApplicationCommand(lilyClient.user.id, slashCommands);
        logger.info("Processing commands as Production.");
    }

    for (const commandId of commandIds) {
        const { name, id } = commandId;
        slashCommandIdsCache.set(name, `</${name}:${id}>`);
    }

    logger.info(`Loaded ${commandIds.length} command IDs from cache`);
}

export function refreshGuildsDatabase(): void {
    const nulledGuilds = db.query("SELECT * FROM guilds WHERE name IS NULL;").all() as Array<Guild>;

    if (nulledGuilds.length === 0) return;

    for (const guild of nulledGuilds) {
        logger.info(`Removed guild: ${guild.name} (${guild.id})`);
        removeEntry(Tables.GUILD, guild.id);
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
    const tables: Array<{ name: string; columns: Array<string> }> = [
        { name: "users", columns: ["id TEXT PRIMARY KEY", "banchoId TEXT", "score_embeds INTEGER", "mode TEXT", "embed_type TEXT", "score_data INTEGER"] },
        { name: "guilds", columns: ["id TEXT PRIMARY KEY", "name TEXT", "owner_id TEXT", "joined_at INTEGER", "prefixes TEXT"] },
        { name: "maps", columns: ["id TEXT PRIMARY KEY", "data TEXT"] },
        { name: "commands", columns: ["id TEXT PRIMARY KEY", "count INTEGER"] },
        { name: "commands_slash", columns: ["id TEXT PRIMARY KEY", "count INTEGER"] },
        {
            name: "osu_scores",
            columns: [
                "id INTEGER PRIMARY KEY",
                "user_id INTEGER",
                "map_id INTEGER",
                "gamemode INTEGER",
                "mods TEXT",
                "score INTEGER",
                "accuracy INTEGER",
                "max_combo INTEGER",
                "grade TEXT",
                "count_50 INTEGER",
                "count_100 INTEGER",
                "count_300 INTEGER",
                "count_miss INTEGER",
                "count_geki INTEGER",
                "count_katu INTEGER",
                "map_state TEXT",
                "ended_at TEXT",
            ],
        },
        {
            name: "osu_scores_pp",
            columns: ["id INTEGER PRIMARY KEY", "pp INTEGER", "pp_fc INTEGER", "pp_perfect INTEGER"],
        },
    ];

    for (const table of tables) {
        const { columns } = table;

        // Create the Databases if they don't exist
        db.run(`CREATE TABLE IF NOT EXISTS ${table.name} (${columns.join(", ")});`);

        //  Get all of the existing databases
        const existingColumns = db.prepare(`PRAGMA table_info(${table.name});`).all() as Array<Columns>;

        // Loop through Columns and add/remove them
        for (const columnNameType of columns) {
            const [columnName] = columnNameType.split(" ");

            const columnExists = existingColumns.some((col) => col.name === columnName);

            if (!columnExists) {
                db.run(`ALTER TABLE ${table.name} ADD COLUMN ${columnNameType};`);
                logger.info(`Added column ${columnName} in ${table.name} table`);
            }
        }

        for (const column of existingColumns) {
            const columnName = column.name;
            const columnNotInTables = !columns.some((colType) => colType.startsWith(columnName));

            if (columnNotInTables) {
                db.run(`ALTER TABLE ${table.name} DROP COLUMN ${columnName};`);
                logger.info(`Removed column ${columnName} from ${table.name}`);
            }
        }
    }

    logger.info("Database up and running!");
}

export async function loadGuildPrefixes(): Promise<void> {
    try {
        const guilds = db.prepare("SELECT id, prefixes FROM guilds WHERE prefixes IS NOT NULL").all() as Array<{ id: string; prefixes: string }>;

        let loadedCount = 0;
        for (const guild of guilds) {
            try {
                if (guild.prefixes) {
                    const prefixes = JSON.parse(guild.prefixes) as Array<string>;
                    guildPrefixesCache.set(guild.id, prefixes);
                    loadedCount++;
                }
            } catch (parseError) {
                logger.error(`Failed to parse prefixes for guild ${guild.id}`, parseError as Error);
            }
        }

        logger.info(`Loaded ${loadedCount}/${guilds.length} guild prefixes into cache`);
    } catch (error) {
        logger.error("Failed to load guild prefixes", error as Error);
    }
}
