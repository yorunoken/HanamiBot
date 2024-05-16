import { prefixesCache } from "./guildCreate";
import { DEFAULT_PREFIX } from "@utils/constants";
import { commandAliases, loadLogs, messageCommands } from "@utils/initalize";
import { getEntry, insertData } from "@utils/database";
import { fuzzySearch } from "@utils/fuzzy";
import { Tables } from "@type/database";
import { EmbedType } from "lilybird";
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

    // nyann :3333
    const CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS = 0.6;
    if (content === ":3" || content === "3:" && Math.random() > CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS) {
        await message.reply(message.content === ":3" ? "3:" : ":3");
        return;
    }

    if (content.includes("727") || content.includes("7,27") || content.includes("72,7") || content.toLowerCase().includes("wysi")) {
        await message.react("wysia:1240624238189088869", true);
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

    const channel = await message.fetchChannel();
    if (!channel.isText()) return;

    await client.rest.triggerTypingIndicator(channel.id);

    try {
        await command.run({ client: client, message, args, prefix, index, commandName, channel });

        const guild = await client.rest.getGuild(guildId);
        await loadLogs(`INFO: [${guild.name}] ${author.username} used prefix command \`${command.name}\``);
        const docs = getEntry(Tables.COMMAND, command.name);

        if (docs === null)
            insertData({ table: Tables.COMMAND, data: [ { key: "count", value: 1 } ], id: command.name });
        else
            insertData({ table: Tables.COMMAND, data: [ { key: "count", value: Number(docs.count ?? 0) + 1 } ], id: docs.id });
    } catch (error) {
        const err = error as Error;

        await message.reply(`Oops, you came across an error!\nHere's a summary of it:\n\`\`\`${err.stack}\`\`\`\nDon't worry, the same error log has been sent to the owner of this bot.`);

        const guild = await client.rest.getGuild(guildId);

        await client.rest.createMessage(message.channelId, {
            content: `<@${process.env.OWNER_ID}> STACK ERROR, GET YOUR ASS TO WORK`,
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: `Runtime error on command: ${command.name}`,
                    fields: [
                        {
                            name: "User",
                            value: `<@${author.id}> (${author.username})`
                        },
                        {
                            name: "Guild",
                            value: `[${guild.name}](https://discord.com/channels/${guildId}/${message.channelId})`
                        },
                        {
                            name: "Message",
                            value: content
                        },
                        {
                            name: "Error",
                            value: err.stack ?? "undefined (look at logs)"
                        }
                    ]
                }
            ]
        });

        console.error(err);
        await loadLogs(`ERROR: [${guild.name}] ${author.username} had an error in prefix command \`${command.name}\`: ${err.stack}`, true);
        const docs = getEntry(Tables.COMMAND, command.name);

        if (docs === null)
            insertData({ table: Tables.COMMAND, data: [ { key: "count", value: 1 } ], id: command.name });
        else
            insertData({ table: Tables.COMMAND, data: [ { key: "count", value: Number(docs.count ?? 0) + 1 } ], id: docs.id });
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
    insertData({ table: Tables.USER, id: discordId, data: [ { key: "banchoId", value: osuId } ] });
}
