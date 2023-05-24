const { SlashCommandBuilder } = require("@discordjs/builders");
const { buildTopsEmbed } = require("../../../command-embeds/topEmbed");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { v2 } = require("osu-api-extended");

async function run(interaction, username) {
  await interaction.deferReply();
  const mode = interaction.options.getString("mode") ?? "osu";
  const reverse = interaction.options.getBoolean("reverse") ?? false;
  let page = interaction.options.getInteger("page") ?? 1;
  const index = interaction.options.getInteger("index");
  const recent = true;

  const user = await v2.user.details(username, mode);
  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const tops = await v2.scores.user.category(user.id, "best", { mode: mode, limit: 100 });
  if (tops.length === 0) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No plays found for ${user.username}.`)] });
    return;
  }

  const _ = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  const _b = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  let _row = new ActionRowBuilder().addComponents(_b, _);

  const nextPage = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);
  const prevPage = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
  let row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));

  if (page === 1) {
    if (tops.length > 5) {
      row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
    }
  } else if (tops.length <= 5) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));
  } else if (page === Math.ceil(tops.length / 5)) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
  } else {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
  }

  const embed = await buildTopsEmbed(tops, user, page, mode, index, reverse, recent);
  const response = await interaction.editReply({ embeds: [embed], components: [row] });

  const filter = (i) => i.user.id === interaction.user.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    try {
      if (i.customId == "next") {
        if (!(page + 1 > Math.ceil(tops.length / 5))) {
          page++;
          if (page === Math.ceil(tops.length / 5)) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const embed = await buildTopsEmbed(tops, user, page, mode, index, reverse, recent);
        await interaction.editReply({ embeds: [embed], components: [row] });
      } else if (i.customId == "prev") {
        if (!(page <= 1)) {
          page--;
          if (page === 1) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const embed = await buildTopsEmbed(tops, user, page, mode, index, reverse, recent);
        await interaction.editReply({ embeds: [embed], components: [row] });
      }
    } catch (e) {
      console.error(e);
    }
  });

  collector.on("end", async (i) => {
    try {
      await interaction.editReply({ components: [] });
    } catch (e) {}
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("recentbest")
    .setDescription("Displays a user's top 100 plays based on time specified by mode")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)").setRequired(false))
    .addStringOption((option) =>
      option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "fruits", value: "fruits" })
    )
    .addIntegerOption((option) => option.setName("page").setDescription("The page").setMinValue(1).setMaxValue(20))
    .addIntegerOption((option) => option.setName("index").setDescription("The index of the play you want").setMinValue(1).setMaxValue(100))
    .addBooleanOption((option) => option.setName("reverse").setDescription("Whether or not to reverse the order")),
  run: async ({ interaction }) => {
    const username = await getUsername(interaction);
    if (!username) return;

    await run(interaction, username);
  },
};
