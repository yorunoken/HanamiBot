const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ContextMenuCommandAssertions } = require("discord.js");

const QuestionType = {
  truth: "truth",
  dare: "dare",
  random: "random",
};

const buttons = {
  truth: new ButtonBuilder().setCustomId("truth").setLabel("Truth").setStyle(ButtonStyle.Primary),
  dare: new ButtonBuilder().setCustomId("dare").setLabel("Dare").setStyle(ButtonStyle.Danger),
  random: new ButtonBuilder().setCustomId("random").setLabel("Random").setStyle(ButtonStyle.Success),
};
let row = new ActionRowBuilder().addComponents(buttons.truth, buttons.dare, buttons.random);

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
async function run(interaction, type, firstTime) {
  let options;
  switch (type) {
    case "truth":
      options = await getTruth();
      break;
    case "dare":
      options = await getDare();
      break;
    case "random":
      options = await getRandom();
      break;
  }

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setAuthor({ name: `Requested by ${interaction.user.tag}`, iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=1024` })
    .setTitle(options.question)
    .setFooter({ text: `Type: ${options.type.toLowerCase()} | Took: ${options.ms}ms` });

  let res;
  if (firstTime === true) {
    res = await interaction.reply({ embeds: [embed], components: [row] });
  } else {
    res = await interaction.channel.send({ embeds: [embed], components: [row] });
  }

  const time = 180 * 1000;
  const component = res.createMessageComponentCollector({ time: time });

  component.on("collect", async (i) => {
    await i.update({ components: [] });
    component.stop();
    const firstTime = false;
    if (i.customId == "truth") {
      run(interaction, QuestionType.truth, firstTime);
    }
    if (i.customId == "dare") {
      run(interaction, QuestionType.dare, firstTime);
    }
    if (i.customId == "random") {
      run(interaction, QuestionType.random, firstTime);
    }
  });
}

/**
 * @typedef {Object} Question
 * @property {string} id - The ID of the question.
 * @property {string} type - The type of question (e.g. "Truth" or "Dare").
 * @property {string} rating - The rating of the question (e.g. "PG", "PG-13", "R").
 * @property {string} question - The text of the question.
 * @property {number} ms - How long it took to get a response from the API.
 */

/**
 * @returns {Promise<Question>} Random question.
 */

async function getRandom() {
  const random = Math.floor(Math.random() * 2);
  if (random === 1) {
    return await getTruth();
  }
  return await getDare();
}

/**
 * @returns {Promise<Question>} The truth question.
 */
async function getTruth() {
  const _ = Date.now();
  const url = "https://api.truthordarebot.xyz/v1/truth";
  const res = await fetch(url).then((res) => res.json());
  const ms = Date.now() - _;
  res.ms = ms;
  return res;
}

/**
 * @returns {Promise<Question>} The dare question.
 */
async function getDare() {
  const _ = Date.now();
  const url = "https://api.truthordarebot.xyz/api/dare";
  const res = await fetch(url).then((res) => res.json());
  const ms = Date.now() - _;
  res.ms = ms;
  return res;
}

module.exports = {
  data: new SlashCommandBuilder().setName("dare").setDescription("Get a dare question."),
  run: async (client, interaction) => {
    const firstTime = true;
    await run(interaction, QuestionType.dare, firstTime);
  },
};
