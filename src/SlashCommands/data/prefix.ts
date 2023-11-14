import { SlashCommandBuilder } from "discord.js";
export const data = new SlashCommandBuilder()
  .setName("prefix")
  .setDescription("Set the prefix of the bot.")
  .addSubcommand((o) =>
    o
      .setName("add")
      .setDescription("Add a prefix")
      .addStringOption((o) => o.setName("prefix").setDescription("The prefix").setRequired(true))
  )
  .addSubcommand((o) =>
    o
      .setName("remove")
      .setDescription("Remove a prefix")
      .addStringOption((o) => o.setName("prefix").setDescription("The prefix").setRequired(true))
  )
  .addSubcommand((o) => o.setName("reset").setDescription("Remove all of the prefixes"))
  .addSubcommand((o) => o.setName("list").setDescription("Get a list of prefixes"));
