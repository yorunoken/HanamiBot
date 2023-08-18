const { buildTopsEmbed } = require("../../../command-embeds/topEmbed");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { v2, mods } = require("osu-api-extended");

async function run(interaction, username) {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nochoke")
    .setDescription("Removes combo breaks from your top plays and recalculates them")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)").setRequired(false))
    .addStringOption((option) => option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "catch", value: "fruits" }))
    .addStringOption((option) => option.setName("mods").setDescription("Specify a mod combination").setRequired(false))
    .addIntegerOption((option) => option.setName("page").setDescription("The page").setMinValue(1).setMaxValue(20))
    .addIntegerOption((option) => option.setName("index").setDescription("The index of the play you want").setMinValue(1).setMaxValue(100)),
  run: async ({ interaction }) => {
    const username = await getUsername(interaction);
    if (!username) return;

    await run(interaction, username);
  },
};
