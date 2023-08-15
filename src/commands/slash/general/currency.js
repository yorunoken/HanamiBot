const { SlashCommandBuilder } = require("@discordjs/builders");
const currencies = require("../../../utils/currencies.js").currencies;
const stringSimilarity = require("string-similarity");

async function makeRequest(curr1, curr2) {
  let APIKEY = process.env.CURRENCY_API;
  const url = `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${APIKEY}&symbols=${curr2}&base=${curr1}`;
  return await fetch(url).then((res) => res.json());
}

const run = async ({ interaction }) => {
  await interaction.deferReply();

  const curr1 = interaction.options.getString("curr1").toUpperCase();
  const curr1Value = interaction.options.getNumber("curr1_value");
  if (curr1Value < 0) {
    return interaction.editReply(`curr1_value must be greater than 0`);
  }

  const curr2 = interaction.options.getString("curr2").toUpperCase();

  const isInvalidCurrency = (currency) => !currencies.includes(currency);

  const suggestCorrection = (inputCurrency) => {
    const matches = stringSimilarity.findBestMatch(inputCurrency, currencies);
    return matches.bestMatch.target;
  };

  if (isInvalidCurrency(curr1)) {
    const suggestedCurrency = suggestCorrection(curr1);
    return interaction.editReply(`The first currency wasn't quite right. Did you mean \`${suggestedCurrency}\`?`);
  }

  if (isInvalidCurrency(curr2)) {
    const suggestedCurrency = suggestCorrection(curr2);
    return interaction.editReply(`The second currency wasn't quite right. Did you mean \`${suggestedCurrency}\`?`);
  }

  const exchangeRates = await makeRequest(curr1, curr2, curr1Value);
  if (!curr1Value) {
    return interaction.editReply(`\`1\` ${exchangeRates.base} equals \`${exchangeRates.rates[curr2]}\` ${curr2}.`);
  } else {
    return interaction.editReply(`\`${curr1Value}\` ${exchangeRates.base} equals \`${exchangeRates.rates[curr2] * curr1Value}\` ${curr2}.`);
  }
};

const data = new SlashCommandBuilder()
  .setName("currency")
  .setDescription("Get Exchange rates from over 400 currencies")
  .addStringOption((option) => option.setName("curr1").setDescription("First currency (Enter its code. eg. TRY, GEL)").setRequired(true))
  .addStringOption((option) => option.setName("curr2").setDescription("Second currency (Enter its code. eg. TRY, GEL)").setRequired(true))
  .addNumberOption((option) => option.setName("curr1_value").setDescription("How much should curr1 be? Defaults to 1."));

module.exports = {
  data,
  run,
};
