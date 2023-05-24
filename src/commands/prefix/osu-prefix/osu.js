const { buildPage1, buildPage2 } = require("../../../command-embeds/osuEmbed");
const { getUsername } = require("../../../utils/getUsernamePrefix");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { v2 } = require("osu-api-extended");

async function run(message, username, mode) {
  await message.channel.sendTyping();

  const user = await v2.user.details(username, mode);
  if (user.error === null) {
    message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`The user \`${username}\` was not found.`)] });
    return;
  }

  let _row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("wating").setLabel("Waiting..").setStyle(ButtonStyle.Secondary).setDisabled(true));

  let showMore = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("more").setLabel("Show More").setStyle(ButtonStyle.Success));
  let showLess = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("less").setLabel("Show Less").setStyle(ButtonStyle.Success));

  const embed = buildPage1(user, mode);
  const response = await message.channel.send({ embeds: [embed], components: [showMore] });

  const filter = (i) => i.user.id === message.author.id;
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
  name: "osu",
  aliases: ["osu", "profile"],
  cooldown: 5000,
  run: async ({ message, args }) => {
    const username = await getUsername(message, args);
    if (!username) return;

    const wanted = ["-osu", "-mania", "-taiko", "-fruits"];
    const modes = wanted.filter((word) => args.indexOf(word) >= 0).map((word) => word.replace("-", ""));
    const mode = modes[0] ?? "osu";

    await run(message, username, mode);
  },
};
