const { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } = require("discord.js");
const fs = require("fs");

/**
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */

async function config(interaction) {
  const subCommands = interaction.options.getSubcommand(false);

  switch (subCommands) {
    case "level":
      await levelConfig(interaction);
      break;
    default:
      interaction.editReply("No option selected. Returning.");
      return;
  }
}

async function levelConfig(interaction) {
  const message = await interaction.options.getString("message");
  const boolean = await interaction.options.getBoolean("active");

  if (message) {
    const pattern = /%user.*%lvl/;
    if (!pattern.test(message)) {
      interaction.editReply("Wrong format. Try again.");
      return;
    }

    const configServers = JSON.parse(await fs.promises.readFile("./serversConfig.json"));
    configServers[interaction.guildId] = {
      ...configServers[interaction.guildId],
      message: message,
    };
    await fs.promises.writeFile("./serversConfig.json", JSON.stringify(configServers, null, 2));
    interaction.editReply(`Successfully changed levelup message to "${message}"`);
  }
  if (boolean !== null) {
    const configServers = JSON.parse(await fs.promises.readFile("./serversConfig.json"));
    configServers[interaction.guildId] = {
      ...configServers[interaction.guildId],
      levels: boolean,
    };
    await fs.promises.writeFile("./serversConfig.json", JSON.stringify(configServers, null, 2));
    interaction.editReply(`Successfully changed active config to "${boolean}"`);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDescription("Your server!")
    .addSubcommandGroup((command) =>
      command
        .setName("config")
        .setDescription("Edit your server config")
        .addSubcommand((option) =>
          option
            .setName("level")
            .setDescription("Configure server's level options")
            .addStringOption((option) => option.setName("message").setDescription("Change what message I should say when someone levels up (example: %user leveled up to level %lvl)"))
            .addBooleanOption((option) => option.setName("active").setDescription("Select whether or not to activate the level system."))
        )
    ),
  run: async (client, interaction) => {
    await interaction.deferReply();
    const groups = await interaction.options.getSubcommandGroup(false);

    return;
    switch (groups) {
      case "config":
        await config(interaction);
        break;
      default:
        interaction.editReply("No option selected. Returning.");
        return;
    }
  },
};
