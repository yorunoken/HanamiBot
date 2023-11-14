import { ChatInputCommandInteraction } from "discord.js";
import { PrefixMethods } from "../../types";
import { getServer, insertData } from "../../utils";
import { updateCache } from "../../Handlers/messageCreate";
import { defaultPrefix } from "../../constants";

const MAX_PREFIXES = 10;

async function addPrefix({ interaction }: { interaction: ChatInputCommandInteraction }) {
  const prefix = interaction.options.getString("prefix")!;
  const guildId = interaction.guildId!;

  const document = await getServer(guildId);
  let data = JSON.parse(document.data);

  const documentPrefixes: string[] | undefined = data.prefix;

  if (documentPrefixes && documentPrefixes.includes(prefix)) {
    return await interaction.editReply(`The prefix \`${prefix}\` is already set!`);
  }
  if (documentPrefixes && documentPrefixes.length >= MAX_PREFIXES) {
    return await interaction.editReply(`The maximum number of prefixes you can add is \`${MAX_PREFIXES}\``);
  }
  const prefixesArray = documentPrefixes ? [...documentPrefixes, prefix] : [prefix];

  data.prefix = prefixesArray;

  await insertData({ table: "servers", id: guildId, data: JSON.stringify(data) });
  updateCache(data.prefix, guildId);

  return await interaction.editReply(`The prefix \`${prefix}\` has been added to the array of prefixes!`);
}

async function removePrefix({ interaction }: { interaction: ChatInputCommandInteraction }) {
  const prefix = interaction.options.getString("prefix")!;
  const guildId = interaction.guildId!;

  const document = await getServer(guildId);
  let data = JSON.parse(document.data);

  const documentPrefixes: string[] | undefined = data.prefix;

  if (!documentPrefixes) {
    return await interaction.editReply(`There are no prefixes set for this server yet.`);
  }
  if (!documentPrefixes.includes(prefix)) {
    return await interaction.editReply(`This prefix isn't set in this server yet.`);
  }

  const prefixesArray = documentPrefixes.filter((item) => item !== prefix);
  data.prefix = prefixesArray.length > 0 ? prefixesArray : undefined;

  await insertData({ table: "servers", id: guildId, data: JSON.stringify(data) });
  updateCache(data.prefix, guildId);

  return await interaction.editReply(`The prefix \`${prefix}\` has been removed from the array of prefixes!`);
}

async function list({ interaction }: { interaction: ChatInputCommandInteraction }) {
  const guildId = interaction.guildId!;

  const document = await getServer(guildId);
  let data = JSON.parse(document.data);
  const prefixes: string[] = data.prefix || [defaultPrefix];

  return await interaction.editReply(`This server's current prefixes are: \`${prefixes.join(", ")}\``);
}

export async function run({ interaction }: { interaction: ChatInputCommandInteraction }) {
  await interaction.deferReply();

  const subcommand = interaction.options.getSubcommand();
  switch (subcommand) {
    case PrefixMethods.ADD:
      await addPrefix({ interaction });
      break;
    case PrefixMethods.REMOVE:
      await removePrefix({ interaction });
      break;
    case PrefixMethods.LIST:
      await list({ interaction });
      break;
  }
}
export { data } from "../data/prefix";
