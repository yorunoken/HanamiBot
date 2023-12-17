import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Set the prefix of the bot.")
    .addSubcommand((x) => x
        .setName("add")
        .setDescription("Add a prefix")
        .addStringOption((s) => s.setName("prefix").setDescription("The prefix").setRequired(true)))
    .addSubcommand((z) => z
        .setName("remove")
        .setDescription("Remove a prefix")
        .addStringOption((y) => y.setName("prefix").setDescription("The prefix").setRequired(true)))
    .addSubcommand((o) => o.setName("reset").setDescription("Remove all of the prefixes"))
    .addSubcommand((o) => o.setName("list").setDescription("Get a list of prefixes"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
