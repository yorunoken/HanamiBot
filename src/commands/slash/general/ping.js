const { SlashCommandBuilder } = require("@discordjs/builders");

async function run(interaction) {
  await interaction.deferReply();
  const timeNow = Date.now();
  await interaction.editReply(`Pong! 🏓`);
  const ms = Date.now() - timeNow;
  interaction.editReply(`Pong! 🏓(${ms}ms)`);
}

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check if bot is alive."),
  run: async ({ interaction }) => {
    await run(interaction);
  },
};
