import { ChannelType } from "lilybird";
import type { Event } from "@lilybird/handlers";
import type { Message } from "lilybird";

async function run(message: Message): Promise<void> {
    const { guildId, client, content } = message;
    const channel = await message.fetchChannel();

    if (message.author.bot || !guildId || channel.type !== ChannelType.GUILD_TEXT || !message.guildId || !content) return;

    if (Math.random() > 0.4 && [":3", "3:"].some((item) => content === item)) {
        await channel.send(content === ":3" ? "3:" : ":3");
        return;
    }

    const prefix = prefixCache[guildId] ?? getServer(guildId)?.prefix ?? defaultPrefix;
    if (!prefix)
        return;

    if (!content.startsWith(prefix))
        return;

    const args = content.slice(prefix.length).trim().split(/ +/g);
    let commandName = args.length > 0 ? args.shift()?.toLowerCase() ?? "" : "";
    if (commandName.length === 0) return;

    let number: number | undefined;
    const match = (/(\D+)(\d+)/).exec(commandName);
    if (match) {
        const [, extractedCommandName, extractedNumber] = match;
        commandName = extractedCommandName;
        number = Number(extractedNumber);
    }

    const alias = client.aliases.get(commandName);
    const command = alias ? client.prefixCommands.get(alias) : client.prefixCommands.get(commandName);
    if (!command) return;

    if (cooldown.has(`${command.name}${message.author.id}`)) {
        await message
            .reply({
                content: locale.fails.cooldownTime(ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), { long: true }))
            })
            .then((msg) => setTimeout(async () => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()));
        return;
    }

    command.run({ client: client, message, args, prefix, index: number, commandName, db, locale });

    cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
    setTimeout(() => {
        cooldown.delete(`${command.name}${message.author.id}`);
    }, command.cooldown);

    if (command.name) {
        const doc = getCommand(command.name);
        insertData({ table: "commands", id: command.name, data: [ { name: "count", value: doc ? doc.count + 1 : 1 } ] });
    }
    console.log(`(prefix) responded to ${message.author.username} for ${commandName}`);
}

export default {
    event: "messageCreate",
    run
} satisfies Event<"messageCreate">;
