const { SlashCommandBuilder, ChatInputCommandInteraction, Client } = require("discord.js");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 * @param {Client} client
 */
async function run(interaction, client) {
  if (interaction.user.id !== "372343076578131968") {
    interaction.editReply("You must be the bot's owner to use this command.");
    return;
  }
  interaction.editReply("Terminated.");
  client.destroy();
}

module.exports = {
  data: new SlashCommandBuilder().setName("terminate_instance").setDescription("Terminates current bot instance."),
  run: async ({ interaction, client }) => {
    await interaction.deferReply();
    await run(interaction, client);
  },
};
