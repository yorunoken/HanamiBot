const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { calculator } = require("../../../utils/topsCalculator.js");
const { getUsername } = require("../../../utils/getUsernameInteraction");
const { v2 } = require("osu-api-extended");
const { articles, suffixes } = require("../../../utils/numberManupilation.js");

async function run(interaction) {
  await interaction.deferReply();

  const mode = interaction.options.getString("mode") ?? "osu";
  const added_pp = interaction.options.getNumber("pp");
  const username = await getUsername(interaction);
  if (!username) return;

  const user = await v2.user.details(username, mode);
  if (user.error === null) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }
  const tops = await v2.scores.user.category(user.id, "best", { mode: mode, limit: 100 });
  if (tops.length === 0) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No recent plays found for ${user.username} in osu!${mode === "osu" ? "standard" : mode}.`)] });
    return;
  }

  const options = calculator(tops, added_pp, user);

  const capital = true;
  const article = articles(added_pp, capital);
  const suffix = suffixes(Number(options.pp_placement));

  if (!options) {
    interaction.editReply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**${article} \`${added_pp}pp\` play would not be in ${user.username}'s top plays.**`)] });
    return;
  }
  let mode_enum = 0;
  switch (mode) {
    case "taiko":
      mode_enum = 1;
      break;
    case "mania":
      mode_enum = 3;
      break;
    case "fruits":
      mode_enum = 2;
      break;
  }
  const type = "pp";
  const rank = await fetch(`https://osudaily.net/api/pp.php?k=${process.env.osu_daily_token}&t=${type}&v=${options.new_sum}&m=${mode_enum}`).then((res) => res.json());

  const globalRank = user.statistics.global_rank?.toLocaleString() || "-";
  const countryRank = user.statistics.country_rank?.toLocaleString() || "-";
  const pp = user.statistics.pp.toLocaleString();

  const embed = new EmbedBuilder()
    .setThumbnail(user.avatar_url)
    .setColor("Purple")
    .setAuthor({
      name: `${user.username}: ${pp}pp (#${globalRank} ${user.country.code}#${countryRank})`,
      iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
      url: `https://osu.ppy.sh/users/${user.id}/${mode}`,
    })
    .setTitle(`What If ${user.username} Got ${article} \`${added_pp}pp\` Play?`)
    .setDescription(
      `**${article} \`${added_pp}pp\` play would be ${user.username}'s ${options.pp_placement}${suffix} top play, pushing their pp to \`${options.new_sum.toFixed(2)}(+${options.difference.toFixed(
        2
      )})\`, and pushing their up to rank \`#${rank.rank?.toLocaleString()}\`**`
    );

  interaction.editReply({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whatif")
    .setDescription("Calculates the pp gain of a play")
    .addNumberOption((o) => o.setName("pp").setDescription("The pp value of the hypothetical play").setRequired(true))
    .addStringOption((o) => o.setName("user").setDescription("The user"))
    .addStringOption((option) =>
      option.setName("mode").setDescription("Select an osu! mode").setRequired(false).addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "fruits", value: "fruits" })
    ),
  run: async ({ interaction }) => {
    await run(interaction);
  },
};
