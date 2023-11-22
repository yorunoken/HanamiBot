import { Message, PermissionFlagsBits, ChannelType, TextChannel } from "discord.js";
import { getLoneCommand } from "../Helpers/loneCommands";
import { defaultPrefix } from "../constants";
import { getServer } from "../utils";
import { MyClient } from "../classes";
import { db } from "./ready";
import ms from "ms";

const cooldown = new Map();

const prefixCache: any = {};

export function updatePrefixCache(object: string[], guildId: string) {
  if (!prefixCache[guildId]) return false;
  prefixCache[guildId] = object;
  return true;
}

export const name = "messageCreate";
export const execute = async (message: Message, client: MyClient) => {
  const guildId = message.guildId;
  if (message.author.bot || !guildId || message.channel.type === ChannelType.DM || !client.user || !message.guild) return;

  const channel = message.channel as TextChannel;
  const botPermissions = channel.permissionsFor(client.user!.id);
  if (!botPermissions) return;

  const permissionsHas = botPermissions.has(PermissionFlagsBits.SendMessages) && botPermissions.has(PermissionFlagsBits.ViewChannel);
  if (!permissionsHas) return;

  const randomNumber = Math.floor(Math.random() * 100);

  if (randomNumber > 70) {
    if (message.content === ":3") return message.channel.send("3:");
    if (message.content === "3:") return message.channel.send(":3");
  }

  if (message.content.startsWith("https://")) {
    getLoneCommand(message);
  }

  let prefixOptions = prefixCache[guildId] || (prefixCache[guildId] = JSON.parse((await getServer(guildId)).data)?.prefix) || (prefixCache[guildId] = [defaultPrefix]);
  let prefix = prefixOptions.find((p: string) => message.content.startsWith(p));
  if (!prefix) return;

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.length > 0 ? args.shift()!.toLowerCase() : "";
  if (cmd.length === 0) return;

  let commandName = cmd;
  let number;
  const match = cmd.match(/(\D+)(\d+)/);
  if (match) {
    commandName = match[1];
    number = Number(match[2]);
  }

  const command = client.prefixCommands.get(commandName) || client.prefixCommands.get(client.aliases.get(commandName));
  if (!command) return;

  if (!command.cooldown) {
    command.run({ client, message, args, prefix, index: number, commandName, db });
    return;
  }
  if (cooldown.has(`${command.name}${message.author.id}`))
    return message
      .reply({
        content: `Try again in \`${ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), { long: true })}\``,
      })
      .then((msg) => setTimeout(() => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()));
  command.run({ client, message, args, prefix, index: number, commandName, db });
  cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
  setTimeout(() => {
    cooldown.delete(`${command.name}${message.author.id}`);
  }, command.cooldown);
  console.log(`(prefix) responded to ${message.author.username} for ${commandName}`);
};
