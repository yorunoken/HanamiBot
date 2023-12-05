import { ChatInputCommandInteraction, Client, EmbedBuilder, Message } from "discord.js";
import fs from "fs";
import { Locales, ModuleReturn } from "../Structure/index";
import { getWholeDb, Interactionhandler } from "../utils";

export async function start({ interaction, args, locale }: { interaction: Message | ChatInputCommandInteraction; args?: string[]; locale: Locales }) {
  const options = Interactionhandler(interaction, args);
  const commandName = options.commandName?.length! > 0 ? options.commandName?.join("") : undefined;

  let commands: any = {};
  for (const folder of fs.readdirSync("./src/PrefixCommands")) {
    for (const name of fs.readdirSync(`./src/PrefixCommands/${folder}`)) {
      const command = { ...await import(`../PrefixCommands/${folder}/${name}`) };
      command.category = folder;
      commands[command.name] = command;
    }
  }

  console.log();
  commandName ? commandHelp(options, commandName, commands, locale) : helpMenu(options, commands, locale, interaction.client);
}

function helpMenu(options: any, commands: any, locale: Locales, client: Client) {
  const embed = new EmbedBuilder().setTitle(locale.embeds.help.title);
  const categories: any = {};
  Object.values(commands).forEach((array: any) => categories[array.category] = (categories[array.category] || []).concat(array));
  Object.keys(categories).forEach(x => embed.addFields({ name: x, value: "```" + Object.values(categories[x]).map((element: any) => element.name).join(", ") + "```", inline: true }));

  const currUptimeMs = new Date(Bun.nanoseconds() / 1000000).getTime();
  const currentUnixTime = Math.floor(Date.now() / 1000);
  const uptime = Math.floor(currentUnixTime - (currUptimeMs / 1000));

  embed.addFields({ name: locale.embeds.help.botInfo, value: `- ${locale.embeds.help.botServerCount(client.guilds.cache.size.toLocaleString())}.\n- ${locale.embeds.help.botUptime(`<t:${uptime}:R>`)}`, inline: false });
  embed.addFields({ name: locale.embeds.help.commands, value: getWholeDb("commands").sort((a: any, b: any) => b.count - a.count).slice(0, 5).map((x: any) => `- ${x.name} :  ${x.count}`).join("\n") });
  options.reply({ embeds: [embed] });
}

function commandHelp(options: any, name: string, commands: any, locale: Locales) {
  const command = Object.values(commands).find((cmd: any) => cmd.aliases.some((alias: string) => alias.toLowerCase() === name.toLowerCase()) || cmd.name.toLowerCase() === name.toLowerCase()) as ModuleReturn | undefined;
  if (!command) {
    options.reply(locale.embeds.help.commandNotFound(name));
    return;
  }

  const embed = new EmbedBuilder().setTitle(locale.embeds.help.commandInfoTitleEmbed(command.name)).setDescription(`\`\`\`/${command.name}\`\`\`\n${command.description}\n\nflags:\n${command.flags || "none"}\n\naliases: \`${command.aliases.join(", ")}\``);
  options.reply({ embeds: [embed] });
}
