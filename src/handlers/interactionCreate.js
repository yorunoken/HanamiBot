const { InteractionType } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  execute: async (interaction, db) => {
    const client = interaction.client;
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    try {
      const command = client.slashCommands.get(interaction.commandName);
      command.run(client, interaction, db);
    } catch (e) {
      console.error(e);
      interaction.reply({ content: "There was an error with this interaction. Please try again.", ephemeral: true });
    }
  },
};
