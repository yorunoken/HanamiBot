import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
export const data = new SlashCommandBuilder()
  .setName("language")
  .setDescription("Set the prefix of the bot.")
  .addStringOption((o) => o.setName("language").setDescription("The Language").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
