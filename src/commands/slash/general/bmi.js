const { SlashCommandBuilder, Client, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");

/**
 *
 * @param {Client} client
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(client, interaction) {
  let dot = false;
  let height = interaction.options.getNumber("height").toString();
  const weight = interaction.options.getNumber("weight");
  if (height.includes(".")) {
    dot = true;
  }
  const bmi = calculateBMI(height, weight, dot);
  interaction.editReply({ embeds: [new EmbedBuilder().setTitle("BMI Calculator").setDescription(`Your BMI: \`${bmi.toFixed(2)}\``)] });
}

function calculateBMI(height, weight, dot) {
  if (!dot) {
    return weight / (height / 100) ** 2;
  }
  return weight / height ** 2;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bmi")
    .setDescription("Calculate a BMI")
    .addNumberOption((option) => option.setName("height").setDescription("Height of the user").setRequired(true))
    .addNumberOption((option) => option.setName("weight").setDescription("Weight of the user").setRequired(true)),
  run: async (client, interaction) => {
    await interaction.deferReply();
    await run(client, interaction);
  },
};
