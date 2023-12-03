import { ChatInputCommandInteraction, Message } from "discord.js";
import { updatePrefixCache } from "../cache";
import { defaultPrefix } from "../constants";
import { getServer, insertData, Interactionhandler } from "../utils";

const commands: { [key: string]: Function } = {
  add: addPrefix,
  remove: removePrefix,
  list,
};

const MAX_PREFIXES = 10;
export async function start({ interaction, args }: { interaction: Message | ChatInputCommandInteraction; args?: string[] }) {
  const options = Interactionhandler(interaction, args);
  let subcommand = options.subcommand || getsubCommand(args?.join("")!);
  if (!subcommand) {
    return options.reply("Please provide either of these flags: `add, remove, list`.");
  }
  const prefix = args ? args.filter((arg) => arg.toLowerCase() !== subcommand) : options.prefix;

  commands[subcommand]({ options, prefix });
}

const getsubCommand = (content: string) =>
  content
    .toLowerCase()
    .match(/add|remove|list/i)?.[0]
    ?.toLowerCase();

async function addPrefix({ options, prefix }: { options: any; prefix: string }) {
  const guildId = options.guildId;

  const data = JSON.parse((getServer(guildId)).data);
  const documentPrefixes: string[] | undefined = data.prefix;

  if (documentPrefixes && documentPrefixes.includes(prefix)) {
    return await options.reply(`The prefix \`${prefix}\` is already set!`);
  }
  if (documentPrefixes && documentPrefixes.length >= MAX_PREFIXES) {
    return await options.reply(`The maximum number of prefixes you can add is \`${MAX_PREFIXES}\``);
  }
  const prefixesArray = documentPrefixes ? [...documentPrefixes, prefix] : [prefix];

  data.prefix = prefixesArray;

  insertData({ table: "servers", id: guildId, data: JSON.stringify(data) });
  updatePrefixCache(data.prefix, guildId);

  return await options.reply(`The prefix \`${prefix}\` has been added to the array of prefixes!`);
}

async function removePrefix({ options, prefix }: { options: any; prefix: string }) {
  const guildId = options.guildId!;

  const data = JSON.parse((getServer(guildId)).data);

  const documentPrefixes: string[] | undefined = data.prefix;

  if (!documentPrefixes) {
    return await options.reply("There are no prefixes set for this server yet.");
  }
  if (!documentPrefixes.includes(prefix)) {
    return await options.reply("This prefix isn't set in this server yet.");
  }

  const prefixesArray = documentPrefixes.filter((item) => !item.includes(prefix));
  data.prefix = prefixesArray.length > 0 ? prefixesArray : undefined;

  insertData({ table: "servers", id: guildId, data: JSON.stringify(data) });
  updatePrefixCache(data.prefix, guildId);

  return await options.reply(`The prefix \`${prefix}\` has been removed from the array of prefixes!`);
}

async function list({ options, prefix }: { options: any; prefix: string }) {
  const guildId = options.guildId!;

  let data = JSON.parse(getServer(guildId).data);
  const prefixes: string[] = data.prefix || [defaultPrefix];

  return await options.reply(`This server's current prefixes are: \`${prefixes.join(", ")}\``);
}
