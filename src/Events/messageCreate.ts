import { ChannelType, Message, PermissionFlagsBits, TextChannel } from "discord.js";
import ms from "ms";
import { prefixCache } from "../cache";
import { defaultPrefix } from "../constants";
import { getLoneCommand } from "../Helpers/loneCommands";
import { LocalizationManager } from "../locales";
import { ExtendedClient } from "../Structure";
import BaseEvent from "../Structure/BaseEvent";
import { getServer } from "../utils";
import { db } from "./ready";

const cooldown = new Map();

export default class MessageCreateEvent extends BaseEvent {
  constructor(client: ExtendedClient) {
    super(client);
  }

  public async execute(message: Message): Promise<void> {
    const guildId = message.guildId;
    if (message.author.bot || !guildId || message.channel.type === ChannelType.DM || !this.client.user || !message.guild) return;

    const channel = message.channel as TextChannel;
    const botPermissions = channel.permissionsFor(this.client.user!.id);
    if (!botPermissions) return;

    const permissionsHas = botPermissions.has(PermissionFlagsBits.SendMessages) && botPermissions.has(PermissionFlagsBits.ViewChannel);
    if (!permissionsHas) return;

    if (Math.floor(Math.random() * 100) > 70 && [":3", "3:"].some(item => message.content === item)) {
      message.channel.send(message.content === ":3" ? "3:" : ":3");
      return;
    }

    if (message.content.startsWith("https://")) {
      getLoneCommand(message);
    }

    const prefixOptions = prefixCache[guildId] ?? (prefixCache[guildId] = JSON.parse((getServer(guildId)).data)?.prefix) ?? (prefixCache[guildId] = [defaultPrefix]);
    let prefix = prefixOptions.find((p: string) => message.content.startsWith(p));
    if (!prefix) {
      return;
    }

    if (!message.content.startsWith(prefix)) {
      return;
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    let commandName = args.length > 0 ? args.shift()!.toLowerCase() : "";
    if (commandName.length === 0) return;

    let number;
    const match = commandName.match(/(\D+)(\d+)/);
    if (match) {
      commandName = match[1];
      number = Number(match[2]);
    }

    const alias = this.client.aliases.get(commandName);
    const command = alias ? this.client.prefixCommands.get(alias) : this.client.prefixCommands.get(commandName);
    if (!command) return;

    const locale = new LocalizationManager(this.client.localeLanguage.get(guildId) ?? "en").getLanguage();

    if (!command.cooldown) {
      command.run({ client: this.client, message, args, prefix, index: number, commandName, db, locale });
      return;
    }
    if (cooldown.has(`${command.name}${message.author.id}`)) {
      message
        .reply({
          content: locale.fails.cooldownTime(ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), { long: true })),
        })
        .then((msg) => setTimeout(() => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()));
      return;
    }

    command.run({ client: this.client, message, args, prefix, index: number, commandName, db, locale });
    cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
    setTimeout(() => {
      cooldown.delete(`${command.name}${message.author.id}`);
    }, command.cooldown);
    console.log(`(prefix) responded to ${message.author.username} for ${commandName}`);
  }
}
