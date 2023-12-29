import { Message, SlashCommandBuilder } from "discord.js";

export interface PrefixCommands {
  name: string;
  aliases: Array<string>;
  cooldown: number;
  description: string;
  category: string;
  flags?: string;
  run: (options: Record<string, any>) => Promise<void>;
}

export interface SlashCommands {
  run: (options: Record<string, any>) => Promise<void>;
  data: SlashCommandBuilder;
}

export enum Commands {
  Recent = 0,
  Top = 1,
  Profile = 2,
}

export interface CommandInterface {
  //   initializer: User;
  buttonHandler?: "handleProfileButtons" | "handleRecentButtons" | "handleTopsButtons";
  type: Commands;
  //   embedOptions: EmbedOptions;
  response: Message;
  pageBuilder?: Array<(...args: Array<any>) => any> | ((...args: Array<any>) => any);
}
