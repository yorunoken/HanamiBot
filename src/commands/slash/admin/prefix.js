const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");
const { query } = require("../../../utils/getQuery.js");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function add(interaction) {
  await interaction.deferReply();

  const serverId = interaction.guildId.toString();
  const serverCon = await query({ query: `SELECT * FROM servers WHERE id = ?`, parameters: [serverId], type: "get", name: "value" });
  const newPrefix = interaction.options.getString("prefix");
  if (!serverCon) {
    const jsonArray = JSON.stringify([newPrefix]);
    await query({ query: "INSERT INTO servers (id, value) VALUES (?, ?)", parameters: [serverId, jsonArray], type: "run" });

    const embed = new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription(`Added \`${newPrefix}\` to this server's prefix list.`);
    return interaction.editReply({ embeds: [embed] });
  }

  const prefixBoolean = serverCon.includes(newPrefix);
  if (prefixBoolean) {
    const embed = new EmbedBuilder().setTitle("Error!").setColor("Red").setDescription(`The prefix \`${newPrefix}\` already exists in the prefix list.`);
    return interaction.editReply({ embeds: [embed] });
  }

  const jsonArray = JSON.stringify([...serverCon, newPrefix]);
  await query({
    query: "UPDATE servers SET value = ? WHERE id = ?",
    parameters: [jsonArray, serverId],
    type: "run",
  });
  const embed = new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription(`Added \`${newPrefix}\` to this server's prefix list.`);
  interaction.editReply({ embeds: [embed] });
}

async function rm(interaction) {
  await interaction.deferReply();

  const serverId = interaction.guildId.toString();
  const serverCon = await query({ query: `SELECT * FROM servers WHERE id = ?`, parameters: [serverId], type: "get", name: "value" });
  const removePrefix = interaction.options.getString("prefix");

  const prefixBoolean = serverCon.includes(removePrefix);
  if (!prefixBoolean) {
    const embed = new EmbedBuilder().setTitle("Error!").setColor("Red").setDescription(`The prefix \`${removePrefix}\` doesn't exist in the prefix list.`);
    return interaction.editReply({ embeds: [embed] });
  }

  const newArray = serverCon.filter((filter) => filter !== removePrefix);
  const jsonArray = JSON.stringify(newArray);

  await query({
    query: "UPDATE servers SET value = ? WHERE id = ?",
    parameters: [jsonArray, serverId],
    type: "run",
  });

  var embed = new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription(`Removed \`${removePrefix}\` from this server's prefix list.`);
  if (serverCon.length === 1) {
    var embed = new EmbedBuilder().setTitle("Successful!").setColor("Green").setDescription(`Removed \`${removePrefix}\` from this server's prefix list, leaving the default prefix \`!\``);
  }
  interaction.editReply({ embeds: [embed] });
}

async function list(interaction) {
  await interaction.deferReply();

  const serverId = interaction.guildId.toString();
  const serverCon = await query({ query: `SELECT * FROM servers WHERE id = ?`, parameters: [serverId], type: "get", name: "value" });

  var prefixes = "!";
  if (serverCon.length > 0) {
    var prefixes = serverCon.join(", ");
  }
  var embed = new EmbedBuilder().setTitle("Prefixes").setColor("Green").setDescription(`Prefixes of this server:\n\`${prefixes}\``);
  interaction.editReply({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Set the prefix of a server.")
    .addSubcommand((o) =>
      o
        .setName("add")
        .setDescription("add a prefix to your server")
        .addStringOption((option) => option.setName("prefix").setDescription("Prefix name").setRequired(true))
    )
    .addSubcommand((o) =>
      o
        .setName("remove")
        .setDescription("remove a prefix from your server")
        .addStringOption((option) => option.setName("prefix").setDescription("Prefix name").setRequired(true))
    )
    .addSubcommand((o) => o.setName("list").setDescription("get a list of prefixes in this server"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  run: async ({ interaction }) => {
    const cmds = interaction.options.getSubcommand(false);

    switch (cmds) {
      case "add":
        await add(interaction);
        break;
      case "remove":
        await rm(interaction);
        break;
      case "list":
        await list(interaction);
        break;
      default:
        await list(interaction);
    }
  },
};
