import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import fs from "fs";
import { ModuleReturn } from "../Structure";
import { Interactionhandler } from "../utils";

export async function start({ interaction, args, locale }: { interaction: Message | ChatInputCommandInteraction; args?: string[]; locale: any }) {
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

  commandName ? commandHelp(options, commandName, commands, locale) : helpMenu(options, commands, locale);
}

function helpMenu(options: any, commands: any, locale: any) {
  const embed = new EmbedBuilder().setTitle(locale.embeds.help.title);
  const categories: any = {};
  Object.values(commands).forEach((array: any) => categories[array.category] = (categories[array.category] || []).concat(array));

  embed.addFields({ name: "general", value: "```" + Object.values(categories.general).map((element: any) => element.name).join(", ") + "```", inline: true });
  embed.addFields({ name: "osu", value: "```" + Object.values(categories.osu).map((element: any) => element.name).join(", ") + "```", inline: true });
  embed.addFields({ name: "owner", value: "```" + Object.values(categories.owner).map((element: any) => element.name).join(", ") + "```", inline: true });
  options.reply({ embeds: [embed] });
}

function commandHelp(options: any, name: string, commands: any, locale: any) {
  const command = Object.values(commands).find((cmd: any) => cmd.aliases.some((alias: string) => alias.toLowerCase() === name.toLowerCase()) || cmd.name.toLowerCase() === name.toLowerCase()) as ModuleReturn | undefined;
  if (!command) {
    options.reply(locale.embeds.help.commandNotFound.replace("{NAME}", name));
    return;
  }

  const embed = new EmbedBuilder().setTitle(locale.embeds.help.commandInfoTitleEmbed.replace("{NAME}", command.name)).setDescription(`\`\`\`/${command.name}\`\`\`\n${command.description}\n\nflags:\n${command.flags || "none"}\n\naliases: \`${command.aliases.join(", ")}\``);
  options.reply({ embeds: [embed] });
}
