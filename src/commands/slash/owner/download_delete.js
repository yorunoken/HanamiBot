const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");
const { deleteFiles } = require("../../../utils/driveQuery.js");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
async function run(interaction) {
  if (interaction.user.id !== "372343076578131968") {
    interaction.editReply("You must be the bot's owner to use this command.");
    return;
  }
  deleteFiles();
  interaction.editReply("Deleted.");
}

module.exports = {
  data: new SlashCommandBuilder().setName("googledrive_delete").setDescription("Deletes all the files in bot's google drive"),
  run: async ({ interaction }) => {
    await interaction.deferReply();
    await run(interaction);
  },
};
