import { DEFAULT_PREFIX } from "@utils/constants";
import { commandAliases, loadLogs, messageCommands } from "@utils/initalize";
import { getEntry, insertData } from "@utils/database";
import { fuzzySearch } from "@utils/fuzzy";
import { Tables } from "@type/database";
import { EmbedType } from "lilybird";
import type { Message } from "@lilybird/transformers";
import type { Event } from "@lilybird/handlers";
import { GuildPrefixCache, CooldownCache } from "@utils/redis";

export default {
    event: "messageCreate",
    run,
} satisfies Event<"messageCreate">;

const CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS = 0.2;
async function run(message: Message): Promise<void> {
    if (message.channelId === "1193529619907891331") {
        verifyUser(message);
        return;
    }

    const { content, guildId, client, author } = message;
    if (!content || !guildId || author.bot) return;

    let guildPrefixes: Array<string>;
    try {
        guildPrefixes = (await GuildPrefixCache.get(guildId)) ?? DEFAULT_PREFIX;
    } catch (error) {
        console.error("Failed to get guild prefixes from cache, using default:", error);
        guildPrefixes = DEFAULT_PREFIX;
    }

    let chosenPrefix: string | null = null;

    for (const guildPrefix of guildPrefixes) {
        if (content.startsWith(guildPrefix)) {
            chosenPrefix = guildPrefix;
            break;
        }
    }

    if (chosenPrefix === null) {
        // nyann :3333
        if ((content === ":3" || content === "3:") && Math.random() < CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS) {
            await message.reply(message.content === ":3" ? "3:" : ":3", { allowed_mentions: { replied_user: false, parse: [], roles: [], users: [] } });
            return;
        }

        if (content === "727" || content === "7,27" || content === "72,7" || content === "72.7" || content === "7.27" || content.toLowerCase() === "wysi") {
            await message.react("wysia:1240624238189088869", true);
            return;
        }
        return;
    }

    const args = content.slice(chosenPrefix.length).trim().split(/ +/g);
    let commandName = args.shift()?.toLowerCase();
    if (typeof commandName === "undefined") return;

    let index: number | undefined;
    const match = /(\D+)(\d+)/.exec(commandName);
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

        const nearResults = options
            .filter((option) => option.distance <= 2)
            .map((option) => option.option)
            .join(", ");

        if (nearResults === "") return;

        await message.reply(`It seems like ${commandName} is not a command. Did you mean: \`${nearResults}\`?`, { allowed_mentions: { replied_user: false, parse: [], roles: [], users: [] } });
        return;
    }
    const { default: command } = commandDefault;

    // Check cooldown
    try {
        if (await CooldownCache.exists(command.name, author.id)) {
            const cooldownExpiry = await CooldownCache.get(command.name, author.id);
            const remainingTime = cooldownExpiry ? cooldownExpiry - Date.now() : 0;

            if (remainingTime > 0) {
                try {
                    await message
                        .reply({
                            content: `${remainingTime}ms`,
                        })
                        .then((msg) =>
                            setTimeout(async () => {
                                try {
                                    await msg.delete();
                                } catch (deleteError) {
                                    console.warn("Could not delete cooldown message:", deleteError);
                                }
                            }, remainingTime)
                        );
                } catch (replyError) {
                    console.warn("Could not send cooldown message:", replyError);
                }
                return;
            }
        }
    } catch (cooldownError) {
        console.error("Error checking cooldown, allowing command to proceed:", cooldownError);
        // Continue execution - don't block commands due to Redis issues
    }
    const channel = await message.fetchChannel();
    if (!channel.isText()) return;

    await client.rest.triggerTypingIndicator(channel.id);

    try {
        await command.run({ client: client, message, args, prefix: chosenPrefix, index, commandName, channel });

        const guild = await client.rest.getGuild(guildId);
        await loadLogs(`INFO: [${guild.name}] ${author.username} used prefix command \`${command.name}\``);
        const docs = getEntry(Tables.COMMAND, command.name);

        if (docs === null) insertData({ table: Tables.COMMAND, data: [{ key: "count", value: 1 }], id: command.name });
        else insertData({ table: Tables.COMMAND, data: [{ key: "count", value: Number(docs.count ?? 0) + 1 }], id: docs.id });
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
                    title: `Runtime error on command: ${command.name}`,
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

        console.error(err);
        await loadLogs(`ERROR: [${guild.name}] ${author.username} had an error in prefix command \`${command.name}\`: ${err.stack}`, true);
        const docs = getEntry(Tables.COMMAND, command.name);

        if (docs === null) insertData({ table: Tables.COMMAND, data: [{ key: "count", value: 1 }], id: command.name });
        else insertData({ table: Tables.COMMAND, data: [{ key: "count", value: Number(docs.count ?? 0) + 1 }], id: docs.id });
    }

    // Set cooldown in Redis
    const cooldownDuration = command.cooldown || 1000; // Default to 1 second if undefined
    const cooldownExpiry = Date.now() + cooldownDuration;

    try {
        await CooldownCache.set(command.name, author.id, cooldownExpiry);
    } catch (cooldownError) {
        console.error("Failed to set cooldown:", cooldownError);
    }

    return;
}

function verifyUser(message: Message): void {
    const { content } = message;
    if (!content) return;

    const [discordId, osuId] = content.split("\n");
    insertData({ table: Tables.USER, id: discordId, data: [{ key: "banchoId", value: osuId }] });
}
