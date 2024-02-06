import { cryptr } from "..";
import { DEFAULT_PREFIX } from "../utils/constants";
import { getServer } from "../utils/database";
import { commandAliases, loadLogs, messageCommands } from "../utils/initalize";
import { prefixesCache } from "./guildCreate";
import { ButtonStyle, EmbedType, ComponentType } from "lilybird";
import type { Client, EmbedStructure, Message } from "lilybird";
import type { Event } from "@lilybird/handlers";

const cooldown = new Map();

async function verifyUser(client: Client, message: Message): Promise<void> {
    const { content } = message;
    if (!content) return;

    const [cryptedDiscordId, osuId] = content.split("\n");
    const discordId = cryptr.decrypt(cryptedDiscordId);

    const memberDm = await client.rest.createDM(discordId);

    const embed = {
        type: EmbedType.Rich,
        title: "Welcome to the osu! verifier!",
        description: "Your Discord account is being linked to an osu! user. Please confirm it by pressing the `confirm` button below.\n\nIf you did not mean for this to happen, you can ignore this message.",
        fields: [
            { name: "disordId", value: discordId },
            { name: "osuId", value: osuId }
        ]

    } as EmbedStructure;

    await client.rest.createMessage(memberDm.id, {
        embeds: [embed],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [ { style: ButtonStyle.Primary, custom_id: "verify", label: "Confirm", type: ComponentType.Button } ]
            }
        ]
    });
}

async function run(message: Message): Promise<void> {
    if (message.channelId === "1193529619907891331") {
        await verifyUser(message.client, message);
        return;
    }

    const { content, guildId, client } = message;
    if (!content || !guildId) return;
    const server = await client.rest.getGuild(guildId);

    const channel = await message.fetchChannel();
    if (!channel.isText()) return;

    // nyann :3333
    const CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS = 0.6;
    if ([":3", "3:"].some((item) => message.content === item) && Math.random() > CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS) {
        await channel.send(message.content === ":3" ? "3:" : ":3");
        return;
    }

    const guild = getServer(guildId);
    if (!guild) return;

    const prefixes = prefixesCache.get(guildId) ?? DEFAULT_PREFIX;
    const prefix = prefixes.find((item) => content.startsWith(item));

    if (!prefix)
        return;

    const args = content.slice(prefix.length).trim().split(/ +/g);
    let commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    let index: number | undefined;
    const match = (/(\D+)(\d+)/).exec(commandName);
    if (match) {
        const [, extractedCommandName, extractedNumber] = match;
        commandName = extractedCommandName;
        index = parseInt(extractedNumber) - 1;
    }

    const alias = commandAliases.get(commandName);
    const commandDefault = alias ? messageCommands.get(alias) : messageCommands.get(commandName);

    if (!commandDefault) return;
    const { default: command } = commandDefault;

    if (cooldown.has(`${command.name}${message.author.id}`)) {
        await message
            .reply({
                content: `${cooldown.get(`${command.name}${message.author.id}`)}ms`
            })
            .then((msg) => setTimeout(async () => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()));
        return;
    }

    await client.rest.triggerTypingIndicator(channel.id);
    command.run({ client: client, message, args, prefix, index, commandName }).then(async () => {
        await loadLogs(`INFO: [${server.name}] ${message.author.username} used prefix command \`${command.name}\``);
    }).catch(async (error: Error) => {
        await loadLogs(`ERROR: [${server.name}] ${message.author.username} had an error in prefix command \`${command.name}\`: ${error.stack}`, true);
    });

    cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
    setTimeout(() => {
        cooldown.delete(`${command.name}${message.author.id}`);
    }, command.cooldown);

    return;
}

export default {
    event: "messageCreate",
    run
} satisfies Event<"messageCreate">;
