import { prefixCache } from "../cache";
import { defaultPrefix } from "../constants";
import { LocalizationManager } from "../locales";
import BaseEvent from "../Structure/BaseEvent";
import { getCommand, getServer, insertData } from "../utils";
import { db } from "./ready";
import { ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import ms from "ms";
import type { ExtendedClient } from "../Structure";
import type { Message, TextChannel } from "discord.js";

const cooldown = new Map();

export default class MessageCreateEvent extends BaseEvent {
    public constructor(client: ExtendedClient) {
        super(client);
    }

    public async execute(message: Message): Promise<void> {
        const { guildId } = message;
        if (message.author.bot || !guildId || message.channel.type === ChannelType.DM || !this.client.user || !message.guild) return;

        const channel = message.channel as TextChannel;
        const botPermissions = channel.permissionsFor(this.client.user.id);
        if (!botPermissions) return;

        const permissionsHas = botPermissions.has(PermissionFlagsBits.SendMessages) && botPermissions.has(PermissionFlagsBits.ViewChannel);
        if (!permissionsHas) return;

        if (Math.floor(Math.random() * 100) > 70 && [":3", "3:"].some((item) => message.content === item)) {
            await message.channel.send(message.content === ":3" ? "3:" : ":3");
            return;
        }

        // if (message.content.startsWith("https://")) {
        //   getLoneCommand(message);
        // }

        const prefixOptions = (prefixCache[guildId] ??= JSON.parse(getServer(guildId).data)?.prefix) ?? (prefixCache[guildId] = [defaultPrefix]);
        const prefix = prefixOptions.find((p: string) => message.content.startsWith(p));
        if (!prefix)
            return;

        if (!message.content.startsWith(prefix))
            return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        let commandName = args.length > 0 ? args.shift()!.toLowerCase() : "";
        if (commandName.length === 0) return;

        let number;
        const match = (/(\D+)(\d+)/).exec(commandName);
        if (match) {
            commandName = match[1];
            number = Number(match[2]);
        }

        const alias = this.client.aliases.get(commandName);
        const command = alias ? this.client.prefixCommands.get(alias) : this.client.prefixCommands.get(commandName);
        if (!command) return;

        const locale = new LocalizationManager(this.client.localeLanguage.get(guildId) ?? "en").getLanguage();

        if (cooldown.has(`${command.name}${message.author.id}`)) {
            await message
                .reply({
                    content: locale.fails.cooldownTime(ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), { long: true }))
                })
                .then((msg) => setTimeout(async () => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()));
            return;
        }

        command.run({ client: this.client, message, args, prefix, index: number, commandName, db, locale }).catch(async (error) => {
            await message.channel.send(locale.errorAtRuntime);

            const channelToSendMessage = await this.client.channels.fetch(Bun.env.ERRORS_CHANNELID!);
            if (!channelToSendMessage || !channelToSendMessage.isTextBased()) return;
            await channelToSendMessage.send({
                content: `<@${Bun.env.OWNER_DISCORDID}> STACK ERROR, GET YOUR ASS TO WORK`,
                embeds: [
                    new EmbedBuilder().setTitle(`Runtime error on command: ${command.name}`).setDescription(`Initializer: <@${message.author.id}> (${message.author.username})\nServer: [${message.guild?.name}](https://discord.com/channels/${message.guildId}/${message.channelId})\nMessage: [${message.content}](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id})`).addFields({
                        name: "Error description:",
                        value: `\`\`\`${error.stack}\`\`\``
                    })
                ]
            });
        });

        cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
        setTimeout(() => {
            cooldown.delete(`${command.name}${message.author.id}`);
        }, command.cooldown);

        if (command.name) {
            const doc = getCommand(command.name);
            insertData({ table: "commands", id: command.name, data: doc ? doc.count + 1 : 1 });
        }
        console.log(`(prefix) responded to ${message.author.username} for ${commandName}`);
    }
}