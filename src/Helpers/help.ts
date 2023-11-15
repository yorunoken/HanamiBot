import { Message, ChatInputCommandInteraction, ButtonInteraction, EmbedBuilder } from "discord.js";
import { Interactionhandler } from "../utils";
import { ModuleReturn } from "../types";
import fs from "fs";

export async function start({ interaction, args }: { interaction: Message | ChatInputCommandInteraction; args?: string[] }) {
  const options = Interactionhandler(interaction, args);
  const commandName = options.commandName?.length! > 0 ? options.commandName?.join("") : undefined;

  let commands: any = {};
  for (const folder of fs.readdirSync("./src/PrefixCommands")) {
    for (const name of fs.readdirSync(`./src/PrefixCommands/${folder}`)) {
      const command = {...await import(`../PrefixCommands/${folder}/${name}`)};

      commands[command.name] = command;
    }
  }

  commandName ? commandHelp(options, commandName, commands) : helpMenu(options, commands);
}

function helpMenu(options: any, commands: any) {
  const embed = new EmbedBuilder().setTitle(`Use \`/help <command>\` for details of a command`);
  const categories: any = {}
  Object.values(commands).forEach((array: any) => categories[array.category] = (categories[array.category] || []).concat(array));

  console.log(Object.values(categories.osu).map((element: any) => element.name).join(", "))
  
  embed.addFields({ name: "general", value: "```" + Object.values(categories.general).map((element: any) => element.name).join(", ") + "```" , inline: true });
  embed.addFields({ name: "osu", value: "```" + Object.values(categories.osu).map((element: any) => element.name).join(", ") + "```", inline: true });
  options.reply({ embeds: [embed] });
}

function commandHelp(options: any, name: string, commands: any) {
  const command = Object.values(commands).find((cmd: any) => cmd.aliases.includes(name) || cmd.name.includes(name)) as ModuleReturn | undefined;
  if (!command) {
    options.reply(`The command with the name (or alias) \`${name}\` was not found.`);
    return;
  }

  const embed = new EmbedBuilder().setTitle(`Information of command: ${command.name}`).setDescription(`\`\`\`/${command.name}\`\`\`\n${command.description}\n\nflags:\n${command.flags || "none"}\n\naliases: \`${command.aliases.join(", ")}\``)
  options.reply({ embeds: [embed] });
}
