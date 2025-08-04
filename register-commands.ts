import { readdir, readFile } from "fs/promises";
import { REST } from "lilybird";
import type { ApplicationCommand } from "lilybird";

const log = {
    info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data ? JSON.stringify(data) : ""),
    error: (msg: string, error?: Error) => console.error(`[ERROR] ${msg}`, error?.message || ""),
    fatal: (msg: string, error?: Error) => console.error(`[FATAL] ${msg}`, error?.message || ""),
};

async function extractCommandData(filePath: string): Promise<ApplicationCommand.Create.ApplicationCommandJSONParams | null> {
    try {
        const content = await readFile(filePath, "utf-8");

        const dataMatch = content.match(/data:\s*({[\s\S]*?}),?\s*run/);
        if (!dataMatch) return null;

        const dataStr = dataMatch[1];
        const processedData = dataStr
            .replace(/ApplicationCommandOptionType\.STRING/g, "3")
            .replace(/ApplicationCommandOptionType\.INTEGER/g, "4")
            .replace(/ApplicationCommandOptionType\.BOOLEAN/g, "5")
            .replace(/ApplicationCommandOptionType\.USER/g, "6")
            .replace(/ApplicationCommandOptionType\.CHANNEL/g, "7")
            .replace(/ApplicationCommandOptionType\.ROLE/g, "8")
            .replace(/ApplicationCommandOptionType\.MENTIONABLE/g, "9")
            .replace(/ApplicationCommandOptionType\.NUMBER/g, "10")
            .replace(/ApplicationCommandOptionType\.ATTACHMENT/g, "11")
            .replace(/ApplicationCommandOptionType\.SUB_COMMAND/g, "1")
            .replace(/ApplicationCommandOptionType\.SUB_COMMAND_GROUP/g, "2");

        return eval(`(${processedData})`);
    } catch (error) {
        log.error(`Failed to extract command data from ${filePath}`, error as Error);
        return null;
    }
}

async function registerCommands() {
    log.info("Starting command registration...");

    // Create a REST client
    const rest = new REST(process.env.DISCORD_BOT_TOKEN);
    const user = await rest.getCurrentUser();

    const slashCommands: Array<ApplicationCommand.Create.ApplicationCommandJSONParams> = [];

    const items = await readdir("./src/commands", { recursive: true });
    for (const item of items) {
        const [category, cmd] = item.split(process.platform === "win32" ? "\\" : "/");
        if (!category || !cmd) continue;
        if (category === "data") continue;

        const filePath = `./src/commands/${category}/${cmd}`;
        const commandData = await extractCommandData(filePath);
        if (commandData) {
            slashCommands.push(commandData);
        }
    }

    log.info(`Found ${slashCommands.length} commands to register`);

    try {
        // Register commands globally
        const registeredCommands = await rest.bulkOverwriteGlobalApplicationCommand(user.id, slashCommands);

        log.info(`Successfully registered ${registeredCommands.length} commands:`, {
            commands: registeredCommands.map((cmd: { name: string }) => cmd.name),
        });

        // Save command IDs to a file for the main bot to use
        const commandIds: Record<string, string> = {};
        for (const { name, id } of registeredCommands) {
            commandIds[name] = `</${name}:${id}>`;
        }

        await Bun.write("./command-ids.json", JSON.stringify(commandIds, null, 2));
        log.info("Saved command IDs to command-ids.json");
    } catch (error) {
        log.error("Failed to register commands", error as Error);
        process.exit(1);
    }

    log.info("Command registration completed successfully!");
    process.exit(0);
}

// Run the registration
registerCommands().catch((error) => {
    log.fatal("Command registration failed", error);
    process.exit(1);
});
