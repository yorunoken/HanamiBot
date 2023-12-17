import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("Shows all recent changes made to the bot");
