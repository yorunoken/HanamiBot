import { ChannelType, Message, PermissionFlagsBits, TextChannel } from "discord.js";
import ms from "ms";
import { prefixCache } from "../cache";
import { MyClient } from "../classes";
import { defaultPrefix } from "../constants";
import { getLoneCommand } from "../Helpers/loneCommands";
import { getServer } from "../utils";
import { db } from "./ready";

const cooldown = new Map();

async function checkForMention(message: Message, client: MyClient) {
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

  const reply = () => message.reply(messagesArray[Math.floor(messagesArray.length * Math.random())]);

  if (["hanami", "mia"].some((char) => message.content.toLowerCase().includes(char)) || message.content.includes(`<@${client.user?.id}>`) || (message.reference && (await message.fetchReference()).author.id === client.user?.id)) {
    reply();
  }
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
  if (!prefix) {
    await checkForMention(message, client);
    return;
  }

  if (!message.content.startsWith(prefix)) {
    await checkForMention(message, client);
    return;
  }

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
  if (cooldown.has(`${command.name}${message.author.id}`)) {
    return message
      .reply({
        content: `Try again in \`${ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), { long: true })}\``,
      })
      .then((msg) => setTimeout(() => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()));
  }
  command.run({ client, message, args, prefix, index: number, commandName, db });
  cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
  setTimeout(() => {
    cooldown.delete(`${command.name}${message.author.id}`);
  }, command.cooldown);
  console.log(`(prefix) responded to ${message.author.username} for ${commandName}`);
};
