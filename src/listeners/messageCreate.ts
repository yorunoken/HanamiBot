import { decrypt } from "..";
import { DEFAULT_PREFIX } from "../utils/constants";
import { commandAliases, loadLogs, messageCommands } from "../utils/initalize";
import { getCommand, insertData } from "../utils/database";
import { prefixesCache } from "./guildCreate";
import { ButtonStyle, EmbedType, ComponentType } from "lilybird";
import type { Client, EmbedStructure, Message } from "lilybird";
import type { Event } from "@lilybird/handlers";

const cooldown = new Map();

export default {
    event: "messageCreate",
    run: async (message) => {
        if (message.channelId === "1193529619907891331") {
            await verifyUser(message.client, message);
            return;
        }

        const { content, guildId, client, author } = message;
        if (!content || !guildId || author.bot) return;
        const server = await client.rest.getGuild(guildId);

        const channel = await message.fetchChannel();
        if (!channel.isText()) return;

        // nyann :3333
        const CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS = 0.6;
        if ([":3", "3:"].some((item) => message.content === item) && Math.random() > CHANCE_TO_SEND_CUTE_KITTY_CAT_I_LOVE_CATS) {
            await channel.send(message.content === ":3" ? "3:" : ":3");
            return;
        }

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

        if (cooldown.has(`${command.name}${author.id}`)) {
            await message
                .reply({
                    content: `${cooldown.get(`${command.name}${author.id}`)}ms`
                })
                .then((msg) => setTimeout(async () => msg.delete(), cooldown.get(`${command.name}${author.id}`) - Date.now()));
            return;
        }

        await client.rest.triggerTypingIndicator(channel.id);
        command.run({ client: client, message, args, prefix, index, commandName }).then(async () => {
            await loadLogs(`INFO: [${server.name}] ${author.username} used prefix command \`${command.name}\``);
            const docs = getCommand(commandName ?? "");
            if (docs)
                insertData({ table: "commands", data: [ { name: "count", value: docs.count + 1 } ], id: docs.id });
        }).catch(async (error: Error) => {
            console.log(error);
            await loadLogs(`ERROR: [${server.name}] ${author.username} had an error in prefix command \`${command.name}\`: ${error.stack}`, true);
            const docs = getCommand(commandName ?? "");
            if (docs)
                insertData({ table: "commands", data: [ { name: "count", value: docs.count + 1 } ], id: docs.id });
        });

        cooldown.set(`${command.name}${author.id}`, Date.now() + command.cooldown);
        setTimeout(() => {
            cooldown.delete(`${command.name}${author.id}`);
        }, command.cooldown);

        return;
    }

} satisfies Event<"messageCreate">;

async function verifyUser(client: Client, message: Message): Promise<void> {
    const { content } = message;
    if (!content) return;

    const [cryptedDiscordId, osuId] = content.split("\n");
    const discordId = `${decrypt.update(cryptedDiscordId, "hex", "utf-8")}${decrypt.final("utf-8")}`;

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
