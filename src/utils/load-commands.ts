import { readdir } from "node:fs/promises";
import type { Client as LilybirdClient, ApplicationCommand } from "lilybird";
import { DefaultPrefixCommand, DefaultApplicationCommand } from "types/commands/interfaces";

export const prefixCommands = new Map<string, DefaultPrefixCommand>();
export const prefixCommandAliases = new Map<string, string>();
export const applicationCommands = new Map<string, DefaultApplicationCommand>();

export async function loadPrefixCommands(): Promise<void> {
    // Temporary array to store promises of PrefixCommands.
    const tempCommands: Array<Promise<DefaultPrefixCommand>> = [];

    const items = await readdir("./src/commands-prefix", { recursive: true });
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const [category, cmd] = item.split(process.platform === "win32" ? "\\" : "/");
        if (!category || !cmd) continue;

        const command: Promise<DefaultPrefixCommand> = import(`../commands-prefix/${category}/${cmd}`);
        tempCommands.push(command);
    }

    const commands = await Promise.all(tempCommands);
    for (let i = 0; i < commands.length; i++) {
        const defaultCommand = commands[i];
        const { default: command } = defaultCommand;
        const { aliases, name } = command.data;

        // Add the command to the command map.
        prefixCommands.set(name, defaultCommand);

        // Check if the command has aliases and add them to the command map.
        if (aliases && aliases.length > 0 && Array.isArray(aliases)) {
            for (let idx = 0; idx < aliases.length; idx++) {
                const alias = aliases[idx];
                prefixCommandAliases.set(alias, name);
            }
        }
    }
}

export async function loadApplicationCommands(lilybirdClient: LilybirdClient): Promise<void> {
    const applicationCommandsInfo: Array<ApplicationCommand.Create.ApplicationCommandJSONParams> = [];
    const tempCommands: Array<Promise<DefaultApplicationCommand>> = [];

    const items = await readdir("./src/commands-application", { recursive: true });
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const [category, cmd] = item.split(process.platform === "win32" ? "\\" : "/");
        if (!category || !cmd) continue;
        if (category === "data") continue;

        const command: Promise<DefaultApplicationCommand> = import(`../commands-application/${category}/${cmd}`);
        tempCommands.push(command);
    }

    const commands = await Promise.all(tempCommands);
    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        const { default: cmd } = command;
        applicationCommandsInfo.push(cmd.data);
        applicationCommands.set(cmd.data.name, command);
    }

    const commandsIds = await lilybirdClient.rest.bulkOverwriteGlobalApplicationCommand(lilybirdClient.user.id, applicationCommandsInfo);
    for (let i = 0; i < commandsIds.length; i++) {
        const { name, id } = commandsIds[i];
        // slashCommandsIds.set(name, `</${name}:${id}>`);
    }
}
