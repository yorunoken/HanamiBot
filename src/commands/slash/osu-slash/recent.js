const { SlashCommandBuilder } = require("@discordjs/builders");
const { buildRecentsEmbed } = require("../../../command-embeds/recentEmbed");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { v2 } = require("osu-api-extended");

async function run(interaction, username) {
  await interaction.deferReply();
  const mode = interaction.options.getString("mode") ?? "osu";
  let index = interaction.options.getInteger("index") ?? 1;
  let pass = interaction.options.getBoolean("passes") ?? 1;
  switch (pass) {
    case true:
      pass = 0;
      break;
    case false:
      pass = 1;
      break;
  }

  const now1 = Date.now();
  const user = await v2.user.details(username, mode);
  console.log(`got user in ${Date.now() - now1}ms`);
  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const now2 = Date.now();
  const recents = await v2.scores.user.category(user.id, "recent", { include_fails: pass, limit: 100 });
  console.log(`got recents in ${Date.now() - now2}ms`);
  if (recents.length === 0) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No recent plays found for ${user.username}.`)] });
    return;
  }

  const _ = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  const _b = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  let _row = new ActionRowBuilder().addComponents(_b, _);

  const nextPage = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);
  const prevPage = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
  let row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));

  if (index === 1) {
    if (recents.length > 1) {
      row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
    }
  } else if (recents.length <= 1) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));
  } else if (index === recents.length) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
  } else {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
  }

  const now3 = Date.now();
  const embed = await buildRecentsEmbed(recents, user, mode, index - 1);
  console.log(`got embed in ${Date.now() - now3}ms`);
  const response = await interaction.editReply({ embeds: [embed.embed], components: [row] });

  const filter = (i) => i.user.id === interaction.user.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    try {
      if (i.customId == "next") {
        if (index + 1 < recents.length) {
          index++;
          if (index === recents.length) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1);
        await interaction.editReply({ embeds: [embed.embed], components: [row] });
      } else if (i.customId == "prev") {
        if (!(index <= 1)) {
          index--;
          if (index === 1) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1);
        await interaction.editReply({ embeds: [embed.embed], components: [row] });
      }
    } catch (e) {}
  });

  collector.on("end", async (i) => {
    try {
      await interaction.editReply({ components: [] });
    } catch (e) {}
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rs")
    .setDescription("Displays a user's recent score")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)").setRequired(false))
    .addStringOption((option) =>
      option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "fruits", value: "fruits" })
    )
    .addIntegerOption((option) => option.setName("index").setDescription("The index of a recent play.").setMinValue(1).setMaxValue(50))
    .addBooleanOption((option) => option.setName("passes").setDescription("Specify whether only passes should be considered."))
    .addStringOption((option) => option.setName("mods").setDescription("Specify what mods to consider.")),
  run: async ({ interaction }) => {
    const username = await getUsername(interaction);
    if (!username) return;

    await run(interaction, username);
  },
};
