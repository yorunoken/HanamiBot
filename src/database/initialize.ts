import discordDb from "./discord.db" with { type: "sqlite" };
import osuDb from "./osu.db" with { type: "sqlite" };

interface Column {
    name: string;
}

export function initializeDatabase(): void {
    const osuTables: Array<{ name: string; columns: Array<string> }> = [
        {
            name: "scores",
            columns: [
                "score_id INTEGER PRIMARY KEY",
                "user_id INTEGER",
                "difficulty_id INTEGER",
                "gamemode TEXT",
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
                "ended_at TIMESTAMP",
            ],
        },
        {
            name: "scores_pp",
            columns: ["score_id INTEGER PRIMARY KEY", "pp INTEGER", "pp_fc INTEGER", "pp_perfect INTEGER"],
        },
    ];

    const discordTables: Array<{ name: string; columns: Array<string> }> = [
        { name: "users", columns: ["discord_id TEXT PRIMARY KEY", "bancho_id TEXT", "osu_mode TEXT"] },
        { name: "servers", columns: ["server_id TEXT PRIMARY KEY", "name TEXT", "owner_id TEXT", "joined_at INTEGER", "prefixes TEXT"] },
        { name: "commands", columns: ["command_name TEXT PRIMARY KEY", "count INTEGER"] },
        { name: "slash_commands", columns: ["command_name TEXT PRIMARY KEY", "count INTEGER"] },
    ];

    const allTables = [...osuTables, ...discordTables];

    for (let i = 0; i < allTables.length; i++) {
        const table = allTables[i];
        const { columns, name } = table;

        // Get which database to use from the table name
        const db = osuTables.some((t) => t.name === name) ? osuDb : discordDb;

        // Create table if they it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS ${name} (${columns.join(", ")});`);

        // Get all of existing columns in a table
        const existingColumns = db.prepare(`PRAGMA table_info(${name});`).all() as Array<Column>;

        // Loop through Columns and add/remove them
        for (let idx = 0; idx < columns.length; idx++) {
            const columnNameType = columns[idx];
            const [columnName] = columnNameType.split(" ");

            const columnExists = existingColumns.some((col) => col.name === columnName);

            if (!columnExists) {
                db.run(`ALTER TABLE ${name} ADD COLUMN ${columnNameType};`);
                console.log(`Added column ${columnName} in ${name} table`);
            }
        }

        for (let idx = 0; idx < existingColumns.length; idx++) {
            const column = existingColumns[idx];
            const columnName = column.name;
            const columnNotInTables = !columns.some((colType) => colType.startsWith(columnName));

            if (columnNotInTables) {
                db.run(`ALTER TABLE ${name} DROP COLUMN ${columnName};`);
                console.log(`Removed column ${columnName} from ${name}`);
            }
        }
    }

    console.log("Database up and running!");
}
