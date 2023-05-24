const { SlashCommandBuilder } = require("@discordjs/builders");
const { buildPage1, buildPage2 } = require("../../../command-embeds/osuEmbed");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { v2 } = require("osu-api-extended");

async function run(interaction, username, mode) {
  await interaction.deferReply();

  const user = await v2.user.details(username, mode);
  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }

  let _row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("wating").setLabel("Waiting..").setStyle(ButtonStyle.Secondary).setDisabled(true));

  let showMore = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("more").setLabel("Show More").setStyle(ButtonStyle.Success));
  let showLess = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("less").setLabel("Show Less").setStyle(ButtonStyle.Success));

  const embed = buildPage1(user, mode);
  const response = await interaction.editReply({ embeds: [embed], components: [showMore] });

  const filter = (i) => i.user.id === interaction.user.id;
  const collector = response.createMessageComponentCollector({ time: 60000, filter: filter });

  collector.on("collect", async (i) => {
    try {
      if (i.customId === "more") {
        const embed = buildPage2(user, mode);
        console.log(embed);
        await i.update({ components: [_row] });
        response.edit({ embeds: [embed], components: [showLess] });
      } else if (i.customId === "less") {
        await i.update({ components: [_row] });
        const embed = buildPage1(user, mode);
        response.edit({ embeds: [embed], components: [showMore] });
      }
    } catch (e) {}
  });
  collector.on("end", async (i) => {
    try {
      await response.edit({ components: [] });
    } catch (e) {}
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("osu")
    .setDescription("Displays a user's osu! stats specified by mode")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)").setRequired(false))
    .addStringOption((option) =>
      option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "fruits", value: "fruits" })
    ),
  run: async ({ interaction }) => {
    const mode = interaction.options.getString("mode") ?? "osu";
    const username = await getUsername(interaction);
    if (!username) return;

    await run(interaction, username, mode);
  },
};
