import { prefixesCache } from "./guildCreate";
import { DEFAULT_PREFIX } from "@utils/constants";
import { commandAliases, loadLogs, messageCommands } from "@utils/initalize";
import { getCommand, insertData } from "@utils/database";
import { fuzzySearch } from "@utils/fuzzy";
import type { Message } from "@lilybird/transformers";
import type { Event } from "@lilybird/handlers";

export default {
    event: "messageCreate",
    run
} satisfies Event<"messageCreate">;

const cooldown = new Map();

async function run(message: Message): Promise<void> {
    if (message.channelId === "1193529619907891331") {
        verifyUser(message);
        return;
    }

    const { content, guildId, client, author } = message;
    if (!content || !guildId || author.bot) return;

    const channel = await message.fetchChannel();
    if (!channel.isText()) return;

    // nyann :3333
    const CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS = 0.6;
    if (content === ":3" || content === "3:" && Math.random() > CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS) {
        await channel.send(message.content === ":3" ? "3:" : ":3");
        return;
    }

    const prefixes = prefixesCache.get(guildId) ?? DEFAULT_PREFIX;
    let prefix: string | null = null;

    for (let i = 0; i < prefixes.length; i++) {
        const item = prefixes[i];
        if (content.startsWith(item)) {
            prefix = item;
            break;
        }
    }
    if (prefix === null)
        return;

    const args = content.slice(prefix.length).trim().split(/ +/g);
    let commandName = args.shift()?.toLowerCase();
    if (typeof commandName === "undefined") return;

    let index: number | undefined;
    const match = (/(\D+)(\d+)/).exec(commandName);
    if (match) {
        const [, extractedCommandName, extractedNumber] = match;
        commandName = extractedCommandName;
        index = parseInt(extractedNumber) - 1;
    }

    const alias = commandAliases.get(commandName);
    const commandDefault = alias ? messageCommands.get(alias) : messageCommands.get(commandName);

    if (!commandDefault) {
        const possibleCommands = Array.from(messageCommands.values()).map((command) => command.default.name);
        console.log(possibleCommands);
        const options = fuzzySearch(commandName, possibleCommands);

        let nearResults = "";
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option.distance <= 2)
                nearResults += `${i > 0 ? ", " : ""}${option.option}`;
        }

        if (nearResults === "")
            return;

        await message.reply(`It seems like ${commandName} is not a command. Did you mean: \`${nearResults}\`?`);
        return;
    }
    const { default: command } = commandDefault;

    if (cooldown.has(`${command.name}${author.id}`)) {
        await message
            .reply({
                content: `${cooldown.get(`${command.name}${author.id}`)}ms`
            })
            .then((msg) => setTimeout(async () => msg.delete(), cooldown.get(`${command.name}${author.id}`) - Date.now()));
        return;
    }

    await client.rest.triggerTypingIndicator(channel.id);

    try {
        await command.run({ client: client, message, args, prefix, index, commandName, channel });

        const server = await client.rest.getGuild(guildId);
        await loadLogs(`INFO: [${server.name}] ${author.username} used prefix command \`${command.name}\``);
        const docs = getCommand(commandName);

        if (docs === null)
            insertData({ table: "commands", data: [ { name: "count", value: 1 } ], id: command.name });
        else
            insertData({ table: "commands", data: [ { name: "count", value: Number(docs.count ?? 0) + 1 } ], id: docs.id });
    } catch (error) {
        const err = error as Error;

        const server = await client.rest.getGuild(guildId);
        console.log(err);
        await loadLogs(`ERROR: [${server.name}] ${author.username} had an error in prefix command \`${command.name}\`: ${err.stack}`, true);
        const docs = getCommand(command.name);

        if (docs === null)
            insertData({ table: "commands", data: [ { name: "count", value: 1 } ], id: command.name });
        else
            insertData({ table: "commands", data: [ { name: "count", value: Number(docs.count ?? 0) + 1 } ], id: docs.id });
    }

    cooldown.set(`${command.name}${author.id}`, Date.now() + command.cooldown);
    setTimeout(() => {
        cooldown.delete(`${command.name}${author.id}`);
    }, command.cooldown);

    return;
}

function verifyUser(message: Message): void {
    const { content } = message;
    if (!content) return;

    const [discordId, osuId] = content.split("\n");
    insertData({ table: "users", id: discordId, data: [ { name: "banchoId", value: osuId } ] });
}
