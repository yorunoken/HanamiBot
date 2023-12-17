import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get information of commands and see info about the bot")
    .addStringOption((o) => o.setName("command").setDescription("Name (or alias) of the command you want to view."));
