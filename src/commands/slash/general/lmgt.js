const { SlashCommandBuilder } = require("@discordjs/builders");

async function run(interaction, query) {
  await interaction.deferReply();
  interaction.editReply(`https://letmegooglethat.com/?q=${query}`);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lmgt")
    .setDescription("Let me google that for you!")
    .addStringOption((option) => option.setName("query").setDescription("Your query").setRequired(true)),
  run: async (client, interaction) => {
    let query = interaction.options.getString("query");
    query = query.replace(/\s+/g, "+");
    await run(interaction, query);
  },
};
