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
      const command = require(`../PrefixCommands/${folder}/${name}`);

      commands[command.name] = command;
    }
  }

  commandName ? commandHelp(options, commandName, commands) : helpMenu(options, commands);
}

function helpMenu(options: any, commands: any) {
  const embed = new EmbedBuilder().setTitle(`Use \`/help <command>\` for details of a command`);
}

function commandHelp(options: any, name: string, commands: any) {
  const command = Object.values(commands).find((cmd: any) => cmd.aliases.includes(name) || cmd.name.includes(name)) as ModuleReturn | undefined;
  if (!command) {
    options.reply(`The command with the name (or alias) \`${name}\` was not found.`);
    return;
  }

  const embed = new EmbedBuilder().setTitle(`${command.name}`).setFields({ name: "Description", value: command.description, inline: false }, { name: "Aliases", value: `\`\`\`-${command.aliases.join("\n-")}\`\`\``, inline: true }, { name: "Flags", value: command.flags || "none", inline: true });
  options.reply({ embeds: [embed] });
}
