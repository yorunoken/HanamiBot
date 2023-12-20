import { getWholeDb, interactionhandler } from "../utils";
import { EmbedBuilder } from "discord.js";
import { readdir } from "node:fs/promises";
import type { InteractionHandler } from "../Structure/types/utils";
import type { DbCommands, Locales, ModuleReturn, PrefixCommands } from "../Structure/index";
import type { ChatInputCommandInteraction, Client, Message } from "discord.js";

export async function start({ interaction, args, locale }: { interaction: Message | ChatInputCommandInteraction, args?: Array<string>, locale: Locales }): Promise<void> {
    const options = interactionhandler(interaction, args);
    const commandName = options.commandName.length > 0 ? options.commandName.join("") : undefined;

    const commands: Record<string, PrefixCommands> = {};

    const temp: Array<Promise<PrefixCommands>> = [];
    const items = await readdir("./src/PrefixCommands", { recursive: true });
    for (const item of items) {
        const [category, cmd] = item.split("/");
        if (!category || !cmd) continue;

        const command = import(`../PrefixCommands/${category}/${cmd}`) as Promise<PrefixCommands>;
        temp.push(command);
    }

    (await Promise.all(temp)).forEach((command, idx) => {
        const [capturedCategory] = items[idx].split("/");
        const modifiedCommand: PrefixCommands = { ...command };
        modifiedCommand.category = capturedCategory;
        commands[modifiedCommand.name] = modifiedCommand;
    });

    if (commandName) {
        await commandHelp(options, commandName, commands, locale);
        return;
    }
    await helpMenu(options, commands, locale, interaction.client);
}

async function helpMenu(options: InteractionHandler, commands: Record<string, PrefixCommands>, locale: Locales, client: Client): Promise<void> {
    const embed = new EmbedBuilder().setTitle(locale.embeds.help.title);
    const categories: Record<string, Array<string> | undefined> = {};
    Object.values(commands).forEach((cmd) => {
        categories[cmd.category] = (categories[cmd.category] ?? []).concat(cmd.name);
    });
    Object.keys(categories).forEach((x) => {
        const values = categories[x];
        const formattedValues = values ? `\`\`\`${values.join(", ")}\`\`\`` : "No commands available";
        embed.addFields({ name: x, value: formattedValues, inline: true });
    });

    const currUptimeMs = new Date(Bun.nanoseconds() / 1000000).getTime() / 1000;
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const uptime = Math.floor(currentUnixTime - currUptimeMs);

    embed.addFields({
        name: locale.embeds.help.botInfo,
        value: `- ${locale.embeds.help.botServerCount(client.guilds.cache.size.toLocaleString())}.\n- ${locale.embeds.help.botUptime(`<t:${uptime}:R>`)}`,
        inline: false
    });

    const commandsDatabase = getWholeDb("commands") as Array<DbCommands>;
    embed.addFields({
        name: locale.embeds.help.commands,
        value: commandsDatabase.sort((a, b) => b.count - a.count).slice(0, 5).map((x) => `- ${x.id} :  ${x.count}`)
            .join("\n")
    });

    await options.reply({ embeds: [embed] });
}

async function commandHelp(options: InteractionHandler, name: string, commands: Record<string, PrefixCommands>, locale: Locales): Promise<void> {
    const command = Object.values(commands)
        .find((cmd) => cmd.aliases.some((alias: string) => alias.toLowerCase() === name.toLowerCase()) || cmd.name.toLowerCase() === name.toLowerCase()) as ModuleReturn | undefined;
    if (!command) {
        await options.reply(locale.embeds.help.commandNotFound(name));
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(locale.embeds.help.commandInfoTitleEmbed(command.name))
        .setDescription(`\`\`\`/${command.name}\`\`\`\n${command.description}\n\nflags:\n${command.flags || "none"}\n\naliases: \`${command.aliases.join(", ")}\``);
    await options.reply({ embeds: [embed] });
}
