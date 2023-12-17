import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("link")
    .setDescription("Links your Discord account with an osu! account")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username to link your Discord account with.").setRequired(true));
