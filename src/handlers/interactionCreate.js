const { InteractionType, ChatInputCommandInteraction, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "interactionCreate",

  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @returns
   */
  execute: async (interaction, db) => {
    const client = interaction.client;

    const botMember = interaction.guild.members.cache.get(client.user.id);
    const botPermissions = interaction.channel.permissionsFor(botMember);
    const messagePerm = botPermissions.has(PermissionFlagsBits.SendMessages);
    const viewPerm = botPermissions.has(PermissionFlagsBits.ViewChannel);

    if (!messagePerm) {
      return interaction.reply({ ephemeral: true, content: "I do not have permissions to send messages in this channel. Either try another channel or contact the owner." });
    } else if (!viewPerm) {
      return interaction.reply({ ephemeral: true, content: "I do not have permissions to view this channel. Either try another channel or contact the owner." });
    }

    if (interaction.type !== InteractionType.ApplicationCommand) return;
    try {
      const command = client.slashCommands.get(interaction.commandName);
      command.run({ client, interaction, db });
    } catch (e) {
      console.error(e);
      interaction.reply({ content: `There was an error with this interaction. Please try again. ${e}`, ephemeral: true });
    }
  },
};
