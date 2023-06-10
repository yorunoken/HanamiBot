const { SlashCommandBuilder } = require("@discordjs/builders");
const { buildRecentsEmbed } = require("../../../command-embeds/recentEmbed");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { query } = require("../../../utils/getQuery.js");
const { v2, mods } = require("osu-api-extended");

async function run(interaction, username) {
  await interaction.deferReply();
  const mode = interaction.options.getString("mode") ?? "osu";
  const modsInt = interaction.options.getString("mods");
  let index = interaction.options.getInteger("index") ?? 1;
  let pass = !interaction.options.getBoolean("passes") ?? true;

  const modID = modsInt ? mods.id(modsInt) : undefined;

  const now1 = Date.now();
  const user = await v2.user.details(username, mode);

  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const now2 = Date.now();

  const recents = await v2.scores.user.category(user.id, "recent", { include_fails: pass, limit: 100, mods: modID });

  if (recents.length === 0) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No recent plays found for ${user.username} in osu!${mode === "osu" ? "standard" : mode}.`)] });
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

  let content = "";
  if (modID) {
    content = `sorting by mods: \`${modsInt}\``;
  }

  const now3 = Date.now();
  const tops = await get100thPlay(user, mode, recents[index - 1]);
  const embed = await buildRecentsEmbed(recents, user, mode, index - 1, tops);

  const response = await interaction.editReply({ content: content, embeds: [embed.embed], components: [row] });

  const filter = (i) => i.user.id === interaction.user.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    try {
      if (i.customId == "next") {
        if (index + 1 <= recents.length) {
          index++;
          if (index === recents.length) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const tops = await get100thPlay(user, mode, recents[index - 1]);
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1, tops);
        await interaction.editReply({ content: content, embeds: [embed.embed], components: [row] });
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
        const tops = await get100thPlay(user, mode, recents[index - 1]);
        const embed = await buildRecentsEmbed(recents, user, mode, index - 1, tops);
        await interaction.editReply({ content: content, embeds: [embed.embed], components: [row] });
      }
    } catch (e) {}
  });

  collector.on("end", async (i) => {
    try {
      await interaction.editReply({ components: [] });
    } catch (e) {}
  });
}

async function get100thPlay(user, mode, recent) {
  var doc = await query({ query: `SELECT * FROM osuUser WHERE id = ?`, parameters: [user.id], name: "value", type: "get" });
  if (!doc) {
    var tops = await v2.scores.user.category(user.id, "best", { mode: mode, limit: 100 });
    await query({ query: `INSERT INTO osuUser (id, value) VALUES (?, json_object('pp100', ?))`, parameters: [user.id, tops[tops.length - 1].pp], type: "run" });
    var doc = await query({ query: `SELECT value FROM osuUser WHERE id = ${user.id}`, name: "value", type: "get" });
  }
  const top100 = doc?.pp100;
  if (recent.pp < top100) {
    return "";
  }
  if (!recent.pp) {
    return "";
  }
  if (!tops) {
    var tops = await v2.scores.user.category(user.id, "best", { mode: mode, limit: 100 });
  }
  const newValue = recent.pp;
  const index = getIndex(tops, newValue);

  return recent.beatmap.status === "ranked" ? `Personal Best #${index}` : `Personal Best #${index} (if ranked)`;
}

function getIndex(tops, value) {
  let insertIndex = 1;
  for (const element of tops) {
    const pp = element.pp;
    if (pp <= value) {
      break;
    }
    insertIndex++;
  }
  return insertIndex;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rs")
    .setDescription("Displays a user's recent score")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)").setRequired(false))
    .addStringOption((option) =>
      option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "fruits", value: "fruits" })
    )
    .addStringOption((option) => option.setName("mods").setDescription("Specify a mod combination").setRequired(false))
    .addIntegerOption((option) => option.setName("index").setDescription("The index of a recent play.").setMinValue(1).setMaxValue(50))
    .addBooleanOption((option) => option.setName("passes").setDescription("Specify whether only passes should be considered.")),
  run: async ({ interaction }) => {
    const username = await getUsername(interaction);
    if (!username) return;

    await run(interaction, username);
  },
};
