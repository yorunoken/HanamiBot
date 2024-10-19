import { Event } from "@lilybird/handlers/simple";
import { Message } from "@lilybird/transformers";
import { EmbedType } from "lilybird";

import { serverPrefixesCache } from "cache";
import { CHANCE_TO_SEND_CAT_EMOTICON, DEFAULT_PREFIX } from "config";
import { prefixCommandAliases, prefixCommands } from "utils/load-commands";
import { log } from "utils/logs";
import { getEntry, insertData } from "database/tools";
import { Tables } from "types/database/enums";

export default {
    event: "messageCreate",
    run,
} satisfies Event<"messageCreate">;

const userCooldown = new Map();

async function run(message: Message) {
    const { content, guildId, client, author } = message;
    if (!content || !guildId || author.bot) return;

    const prefixes = serverPrefixesCache.get(guildId) ?? DEFAULT_PREFIX;
    let prefix: string | null = null;

    for (let i = 0; i < prefixes.length; i++) {
        const item = prefixes[i];
        if (content.startsWith(item)) {
            prefix = item;
            break;
        }
    }

    // If the message doesn't start with the prefix, we do our shenaningans. :>
    if (prefix === null) {
        // If the user has typed :3 or 3:, we have a chance to send a cute kitty emoticon here :3.
        if ((content === ":3" || content === "3:") && Math.random() < CHANCE_TO_SEND_CAT_EMOTICON) {
            await message.reply(message.content === ":3" ? "3:" : ":3", { allowed_mentions: { replied_user: false, parse: [], roles: [], users: [] } });
            return;
        }

        // If the message has `727`, we react with the WYSIA emote.
        if (content === "727" || content === "7,27" || content === "72,7" || content === "72.7" || content === "7.27" || content.toLowerCase() === "wysi") {
            await message.react("wysia:1240624238189088869", true);
            return;
        }
        return;
    }

    // Define `args`. This includes the command name as well as the actual "args" of the command.
    // This means it can be empty if the user only typed the prefix.
    const args = content.slice(prefix.length).trim().split(/ +/g);
    let commandName = args.shift()?.toLowerCase();

    // Return if `commandName` is undefined, which means `args` is empty.
    if (typeof commandName === "undefined") return;

    let index: number | undefined;

    // Check if the command is a numbered command.
    // If it is, we extract the index from the command name.
    const indexMatch = commandName.match(/(\D+)(\d+)$/);
    if (indexMatch) {
        commandName = indexMatch[1];
        index = Number(indexMatch[2]) - 1;
    }

    const commandAliases = prefixCommandAliases.get(commandName);
    const commandDefault = commandAliases ? prefixCommands.get(commandAliases) : prefixCommands.get(commandName);

    // Couldn't find the command with that name, so we return.
    if (typeof commandDefault === "undefined") {
        return;
    }

    // Extract the command from the default export.
    const command = commandDefault.default;

    // Check if `commandName-authorId` exists in the cooldown map.
    if (userCooldown.has(`${command.data.name}-${author.id}`)) {
        await message
            .reply({
                content: `Too fast, tiger! Try again in ${userCooldown.get(`${command.data.name}-${author.id}`)}ms`,
            })
            .then((msg) => setTimeout(async () => msg.delete(), 2000));
        return;
    }

    const channel = await message.fetchChannel();
    if (!channel.isText()) return;
    await client.rest.triggerTypingIndicator(channel.id);

    try {
        await command.exec({ client: client, message, args, prefix, index, commandName, channel });

        const guild = await client.rest.getGuild(guildId);
        await log(`INFO: [${guild.name}] ${author.username} used prefix command \`${command.data.name}\``);
    } catch (error) {
        const err = error as Error;

        await message.reply(`Oops, you came across an error!\nHere's a summary of it:\n\`\`\`${err.stack}\`\`\`\nDon't worry, the same error log has been sent to the owner of this bot.`, {
            allowed_mentions: { replied_user: false, parse: [], roles: [], users: [] },
        });

        const guild = await client.rest.getGuild(guildId);

        await client.rest.createMessage(process.env.ERROR_CHANNEL_ID, {
            content: `<@${process.env.OWNER_ID}> STACK ERROR, GET YOUR ASS TO WORK`,
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: `Runtime error on command: ${command.data.name}`,
                    fields: [
                        {
                            name: "User",
                            value: `<@${author.id}> (${author.username})`,
                        },
                        {
                            name: "Guild",
                            value: `[${guild.name}](https://discord.com/channels/${guildId}/${message.channelId})`,
                        },
                        {
                            name: "Message",
                            value: content,
                        },
                        {
                            name: "Error",
                            value: err.stack ?? "undefined (look at logs)",
                        },
                    ],
                },
            ],
        });

        await log(`ERROR: [${guild.name}] ${author.username} had an error in prefix command \`${command.data.name}\`: ${err.stack}`, true);
    }

    // Add command to the commands table
    const docs = getEntry(Tables.COMMANDS, command.data.name);
    if (docs === null) insertData({ table: Tables.COMMANDS, data: [{ key: "count", value: 1 }], id: command.data.name });
    else insertData({ table: Tables.COMMANDS, data: [{ key: "count", value: Number(docs.count ?? 0) + 1 }], id: docs.command_name });

    userCooldown.set(`${command.data.name}${author.id}`, Date.now() + command.data.cooldownMs);
    setTimeout(() => {
        userCooldown.delete(`${command.data.name}${author.id}`);
    }, command.data.cooldownMs);

    return;
}
