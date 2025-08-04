#!/usr/bin/env bun
import { readdir } from "fs/promises";
import { createClient } from "lilybird";
import { logger } from "./src/utils/logger.ts";
import type { ApplicationCommand } from "lilybird";
import type { DefaultSlashCommand } from "./src/types/commands.ts";

async function registerCommands() {
    logger.info("Starting command registration...");

    // Create a temporary client just for registration
    const client = await createClient({
        token: process.env.DISCORD_BOT_TOKEN,
        intents: [],
        listeners: {}, // Required but empty for registration-only client
    });

    const slashCommands: Array<ApplicationCommand.Create.ApplicationCommandJSONParams> = [];
    const temp: Array<Promise<DefaultSlashCommand>> = [];

    // Load all slash commands
    const items = await readdir("./src/commands", { recursive: true });
    for (const item of items) {
        const [category, cmd] = item.split(process.platform === "win32" ? "\\" : "/");
        if (!category || !cmd) continue;
        if (category === "data") continue;

        const command = import(`./src/commands/${category}/${cmd}`) as Promise<DefaultSlashCommand>;
        temp.push(command);
    }

    const commands = await Promise.all(temp);
    for (const command of commands) {
        const { default: cmd } = command;
        slashCommands.push(cmd.data);
    }

    logger.info(`Found ${slashCommands.length} commands to register`);

    try {
        // Register commands globally
        const registeredCommands = await client.rest.bulkOverwriteGlobalApplicationCommand(client.user.id, slashCommands);

        logger.info(`Successfully registered ${registeredCommands.length} commands:`, {
            commands: registeredCommands.map((cmd) => cmd.name),
        });

        // Save command IDs to a file for the main bot to use
        const commandIds: Record<string, string> = {};
        for (const { name, id } of registeredCommands) {
            commandIds[name] = `</${name}:${id}>`;
        }

        await Bun.write("./command-ids.json", JSON.stringify(commandIds, null, 2));
        logger.info("Saved command IDs to command-ids.json");
    } catch (error) {
        logger.error("Failed to register commands", error as Error);
        process.exit(1);
    }

    logger.info("Command registration completed successfully!");
    process.exit(0);
}

// Run the registration
registerCommands().catch((error) => {
    logger.fatal("Command registration failed", error);
    process.exit(1);
});
