import { ChannelType, Message, PermissionFlagsBits, TextChannel } from "discord.js";
import ms from "ms";
import { prefixCache } from "../cache";
import { defaultPrefix } from "../constants";
import { getLoneCommand } from "../Helpers/loneCommands";
import { ExtendedClient } from "../Structure";
import BaseEvent from "../Structure/BaseEvent";
import { getServer } from "../utils";
import { db } from "./ready";

const cooldown = new Map();

export default class MessageCreateEvent extends BaseEvent {
  constructor(client: ExtendedClient) {
    super(client);
  }

  private async checkForMention(message: Message) {
    const messagesArray = [
      "freedom for Palpatine!! :flag_sd: :flag_sd: :flag_sd:",
      "did someone say anime girls?",
      "haiiii ^_^ :3 heyyy haiiii X3 hiiiiiii!!!!!!!",
      "hiii :3333",
      "did you know humans have two hearts? I have mine, and yours (in my basement)",
      "cannot read properties of undefined",
      "[object Object]",
      "undefined",
      "strings are not numbers!",
      "critical error: yoru has no bitches",
      "I stole chips when I was a 6",
      "nom my map",
      "I like staplers,,,,",
      "need me an autist gf, are you autist gf?",
      "yknow I've always wanted? you :3",
      "hm?",
      "HELP     \"",
      "one drink coming up for table 727! HAHA see what I did there?",
      "sometimes I wish I was a woman",
      "I love my owner! im gonna cry myself to sleep tonight",
      "i love beeing a silly little goober",
      "hey, dont stop pinging me. I like it when u do that..",
      "i miss her",
    ];

    if (["hanami", "mia"].some((char) => message.content.toLowerCase().includes(char)) || message.content.includes(`<@${this.client.user?.id}>`) || (message.reference && (await message.fetchReference()).author.id === this.client.user?.id)) {
      message.reply(messagesArray[Math.floor(messagesArray.length * Math.random())]);
    }
  }

  public async execute(message: Message): Promise<void> {
    const guildId = message.guildId;
    if (message.author.bot || !guildId || message.channel.type === ChannelType.DM || !this.client.user || !message.guild) return;

    const channel = message.channel as TextChannel;
    const botPermissions = channel.permissionsFor(this.client.user!.id);
    if (!botPermissions) return;

    const permissionsHas = botPermissions.has(PermissionFlagsBits.SendMessages) && botPermissions.has(PermissionFlagsBits.ViewChannel);
    if (!permissionsHas) return;

    if (Math.floor(Math.random() * 100) > 70) {
      message.channel.send(message.content === ":3" ? "3:" : ":3");
      return;
    }

    if (message.content.startsWith("https://")) {
      getLoneCommand(message);
    }

    let prefixOptions = prefixCache[guildId] || (prefixCache[guildId] = JSON.parse((await getServer(guildId)).data)?.prefix) || (prefixCache[guildId] = [defaultPrefix]);
    let prefix = prefixOptions.find((p: string) => message.content.startsWith(p));
    if (!prefix) {
      await this.checkForMention(message);
      return;
    }

    if (!message.content.startsWith(prefix)) {
      await this.checkForMention(message);
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

    const command = this.client.prefixCommands.get(commandName) || this.client.prefixCommands.get(this.client.aliases.get(commandName));
    if (!command) return;

    if (!command.cooldown) {
      command.run({ client: this.client, message, args, prefix, index: number, commandName, db });
      return;
    }
    if (cooldown.has(`${command.name}${message.author.id}`)) {
      message
        .reply({
          content: `Try again in \`${ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), { long: true })}\``,
        })
        .then((msg) => setTimeout(() => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()));
      return;
    }

    command.run({ client: this.client, message, args, prefix, index: number, commandName, db });
    cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
    setTimeout(() => {
      cooldown.delete(`${command.name}${message.author.id}`);
    }, command.cooldown);
    console.log(`(prefix) responded to ${message.author.username} for ${commandName}`);
  }
}
