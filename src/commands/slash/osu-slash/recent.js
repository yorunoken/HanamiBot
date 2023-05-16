const { SlashCommandBuilder } = require("@discordjs/builders");
const { buildRecentsEmbed } = require("../../../command-embeds/recentEmbed");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernameInteraction");

async function run(interaction, username, db) {
  await interaction.deferReply();
  const mode = interaction.options.getString("mode") ?? "osu";
  let index = interaction.options.getInteger("index") ?? 1;
  const passes = interaction.options.getBoolean("passes");

  const now1 = Date.now();
  const user = await getUser(username, mode);
  console.log(`got user in ${Date.now() - now1}ms`);
  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const now2 = Date.now();
  const recents = await getRecents(user, mode, passes);
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
  let row = new ActionRowBuilder().addComponents(prevPage, nextPage);

  if (index === 1) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled().setDisabled(false));
  } else if (recents.length <= 5) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));
  } else if (index === Math.ceil(recents.length) / 5) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
  } else if (index !== Math.ceil(recents.length) / 5) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
  }

  const now3 = Date.now();
  const embed = await buildRecentsEmbed(recents, user, mode, index - 1, db);
  console.log(`got embed in ${Date.now() - now3}ms`);
  const response = await interaction.editReply({ content: "", embeds: [embed.embed], components: [row] });

  const filter = (i) => i.user.id === interaction.user.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    try {
      if (i.customId == "next") {
        if (!(index + 1 > recents.length)) {
          index++;
          row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage);
        }
        if (index === recents.length) {
          row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
        }
        if (index !== recents.length) {
          row = new ActionRowBuilder().addComponents(prevPage, nextPage);
        }

        await i.update({ components: [_row] });
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1, db);
        await interaction.editReply({ content: "", embeds: [embed.embed], components: [row] });
      } else if (i.customId == "prev") {
        if (!(0 >= index)) {
          index--;
          row = new ActionRowBuilder().addComponents(prevPage, nextPage);
        }
        if (index === Math.ceil(recents.length) / 5) {
          row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
        }
        if (index !== Math.ceil(recents.length) / 5) {
          row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
        }
        if (index === 1) {
          row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled().setDisabled(false));
        }

        await i.update({ components: [_row] });
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1, db);
        await interaction.editReply({ content: "", embeds: [embed.embed], components: [row] });
      }
    } catch (e) {}
  });

  collector.on("end", async (i) => {
    if (i.message !== undefined) {
      await interaction.editReply({ components: [] });
    }
  });
}

async function getRecents(user, mode, passes) {
  let includes = passes;
  switch (passes) {
    case passes === true:
      includes = 0;
    default:
      includes = 1;
  }
  const url = `https://osu.ppy.sh/api/v2/users/${user.id}/scores/recent?mode=${mode}&limit=50&include_fails=${includes}`;
  const headers = {
    Authorization: `Bearer ${process.env.osu_bearer_key}`,
  };
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  return await response.json();
}

async function getUser(username, mode) {
  const url = `https://osu.ppy.sh/api/v2/users/${username}/${mode}`;
  const headers = {
    Authorization: `Bearer ${process.env.osu_bearer_key}`,
  };
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  return await response.json();
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
  run: async (client, interaction, db) => {
    const collection = db.collection("user_data");
    const username = await getUsername(interaction, collection);
    if (!username) return;

    await run(interaction, username, db);
  },
};
