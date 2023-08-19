const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const { leaderboard } = require("../../../command-embeds/leaderboardEmbed.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { query } = require("../../../utils/getQuery.js");
const axios = require("axios");
const { v2 } = require("osu-api-extended");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(client, interaction, username) {
  await interaction.deferReply();
  let page = interaction.options.getInteger("page") ?? 1;

  const mode = interaction.options.getString("mode") ?? "osu";
  let index = interaction.options.getInteger("index") ?? 1;
  let pass = !interaction.options.getBoolean("passes") ?? true;

  const user = await v2.user.details(username, mode);

  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }

  const recents = await v2.scores.user.category(user.id, "recent", { include_fails: pass, limit: 100, mode });
  if (recents.length === 0) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No recent plays found for ${user.username} in osu!${mode === "osu" ? "standard" : mode}.`)] });
    return;
  }

  const requester = await query({ query: `SELECT value FROM users WHERE id = '${interaction.user.id}'`, type: "get", name: "value" });
  const requesterBancho = requester?.BanchoUserId;

  let modsRaw = interaction.options.getString("mods");
  let modifiedMods = "";
  if (modsRaw) {
    modsRaw = modsRaw.toUpperCase();
    const modsArr = modsRaw.match(/.{1,2}/g);
    modifiedMods = modsArr?.map((mod) => `&mods[]=${mod}`).join("");
  }

  let beatmapID = recents[index].beatmap.id;

  const beatmap = await v2.beatmap.id.details(beatmapID);
  if (beatmap.status != "ranked" && beatmap.status != "loved" && beatmap.status != "approved") {
    interaction.editReply("It seems like that map doesn't have a leaderboard..");
  }

  const url = new URL(`https://osu.ppy.sh/beatmaps/${beatmapID}/scores?mode=${beatmap.mode}&type=country${modifiedMods}`);
  const res = await axios.get(url, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } });
  const scores = res.data;

  const _ = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  const _b = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true);
  let _row = new ActionRowBuilder().addComponents(_b, _);

  const nextPage = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);
  const prevPage = new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
  let row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));

  if (page === 1) {
    if (scores.scores.length > 5) {
      row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(false));
    }
  } else if (scores.scores.length <= 5) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(true), nextPage.setDisabled(true));
  } else if (page === Math.ceil(scores.scores.length / 5)) {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
  } else {
    row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
  }

  const embed = await leaderboard(beatmapID, scores, page, beatmap, requesterBancho, interaction.user);
  const response = await interaction.editReply({ content: "", embeds: [embed], components: [row] });

  const filter = (i) => i.user.id === interaction.user.id;
  const collector = response.createMessageComponentCollector({ time: 35000, filter: filter });

  collector.on("collect", async (i) => {
    const score = scores.scores;
    try {
      if (i.customId == "next") {
        if (!(page + 1 >= Math.ceil(score.length / 5))) {
          page++;
          if (page === Math.ceil(score.length / 5)) {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(true));
          } else {
            row = new ActionRowBuilder().addComponents(prevPage.setDisabled(false), nextPage.setDisabled(false));
          }
        }

        await i.update({ components: [_row] });
        const embed = await leaderboard(beatmapID, scores, page, beatmap, requesterBancho, interaction.user);
        await interaction.editReply({ content: "", embeds: [embed], components: [row] });
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
        const embed = await leaderboard(beatmapID, scores, page, beatmap, requesterBancho, interaction.user);
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
    .setName("recentct")
    .setDescription("Get the Turkish leaderboard of the last map you played")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)").setRequired(false))
    .addStringOption((option) => option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "catch", value: "fruits" }))
    .addIntegerOption((option) => option.setName("index").setDescription("The index of a recent play.").setMinValue(1).setMaxValue(50))
    .addBooleanOption((option) => option.setName("passes").setDescription("Specify whether only passes should be considered."))
    .addIntegerOption((option) => option.setName("page").setDescription("Specify what page it should be.")),
  run: async ({ client, interaction }) => {
    const username = await getUsername(interaction);
    if (!username) return;

    await run(client, interaction, username);
  },
};
