import { getUsernameFromArgs, Interactionhandler, showMoreButton, getBeatmapId_FromContext, getMap, downloadMap, insertData, getPerformanceDetails, grades, buttonBoolsIndex, buttonBoolsTops, buildActionRow, nextButton, previousButton } from "../utils";
import { Message, ChatInputCommandInteraction, EmbedBuilder, ButtonInteraction, Client } from "discord.js";
import { BeatmapDetails, ButtonActions } from "../classes";
import { v2 } from "osu-api-extended";

export async function start({ interaction, client, args, type }: { interaction: Message<boolean>; client: Client<boolean>; args: string[]; type: "global" | "country" }) {
  const options = Interactionhandler(interaction, args);

  const userOptions = getUsernameFromArgs(options.author, options.userArgs, true);
  if (!userOptions) {
    return options.reply("Something went wrong.");
  }
  const page = parseInt((userOptions.flags.p as string) || (userOptions.flags.page as string)) - 1 || 0;

  const beatmapId = userOptions.beatmapId || (await getBeatmapId_FromContext(interaction, client));
  if (!beatmapId) {
    return options.reply(`There doesn't seem to be any beatmap embeds in this conversation.`);
  }
  const beatmap = await v2.beatmap.id.details(beatmapId);

  let file = await getMap(beatmapId.toString())?.data;
  if (!file || !["ranked", "loved", "approved"].includes(beatmap.status)) {
    file = await downloadMap(beatmapId);
    insertData({ table: "maps", id: beatmapId.toString(), data: file });
  }

  const beatmapDetails = await new BeatmapDetails().initialize(beatmap, { mods: userOptions.mods || [""] }, file);

  const modifiedMods = userOptions.mods
    ? userOptions.mods
        .join("")
        .match(/.{1,2}/g)
        ?.map((mod: any) => `&mods[]=${mod}`)
        .join("")
    : "";

  const scores = await fetch(`https://osu.ppy.sh/beatmaps/${beatmap.id}/scores?mode=${beatmap.mode}&type=${type}${modifiedMods}`, { headers: { Cookie: `osu_session=${process.env.OSU_SESSION}` } }).then((res) => res.json());
  if (scores.scores.length === 0) {
    return options.reply("This map has no scores in its leaderboard.");
  }

  if (page < 0 || page >= Math.ceil(scores.scores.length / 5)) {
    return options.reply(`Please provide a valid page (between 1 and ${Math.ceil(scores.scores.length / 5)})`);
  }

  const embedOptions = { map: beatmapDetails, fetched: scores, page, file, length: scores.scores.length };
  const components = [buildActionRow([previousButton, nextButton], [buttonBoolsTops("previous", embedOptions), buttonBoolsTops("next", embedOptions)])];
  const response = await options.reply({ content: `Showing ${type} tops`, embeds: [await buildMapEmbed(embedOptions)], components });

  const filter = (i: any) => i.user.id === options.author.id;
  const collector = response.createMessageComponentCollector({ time: 60000, filter });

  collector.on("collect", async function (i: ButtonInteraction) {
    await ButtonActions.handleTopsButtons({ pageBuilder: buildMapEmbed, options: embedOptions, i, response });
  });

  collector.on("end", async () => {
    await response.edit({ components: [] });
  });
}

async function buildMapEmbed({ map, fetched, page, file }: { map: BeatmapDetails; fetched: any; page: number; file: string }) {
  const scores = fetched.scores;

  let description = [];
  const startPage = page! * 5;
  const endPage = startPage + 5;

  for (let i = startPage; i < endPage && i < scores.length; i++) {
    const score = scores[i];
    const stats = score.statistics;
    const mods = score.mods.length > 0 ? score.mods.map((mod: any) => mod.acronym) : [""];
    const hitValues = { count_300: stats.great || 0, count_100: stats.ok || 0, count_50: stats.meh || 0, count_miss: stats.miss || 0, count_geki: stats.perfect || 0, count_katu: stats.good || 0 };
    const performance = getPerformanceDetails({ mapText: file, maxCombo: score.max_combo, modsArg: mods, rulesetId: map.rulesetId, hitValues });

    const textRow1 = `**#${i + 1}** ${grades[score.rank]} **[${score.user.username}](https://osu.ppy.sh/users/${score.user.id}) \`${mods.join("") === "" ? "+NM" : `+${mods.join("")}`}\` __[${performance.maxPerf.difficulty.stars.toFixed(2)}★]__**\n`;
    const textRow2 = `>> **${performance.curPerf?.pp.toFixed(2)}**/${performance.maxPerf.pp.toFixed(2)}pp • (${(score.accuracy * 100).toFixed(2)}%) • ${score.total_score.toLocaleString()}\n`;
    const textRow3 = `>> [${score.max_combo}x/${map.maxCombo}x] { **${score.ruleset_id === 3 ? hitValues.count_geki + "/" : ""}${hitValues.count_300}**/${score.ruleset_id === 3 ? hitValues.count_katu + "/" : ""}${hitValues.count_100}/${score.ruleset_id === 1 ? "" : hitValues.count_50 + "/"}${hitValues.count_miss} } <t:${new Date(score.ended_at).getTime() / 1000}:R>`;
    description.push(textRow1 + textRow2 + textRow3);
  }

  return new EmbedBuilder()
    .setTitle(`${map.artist} - ${map.title}`)
    .setURL(`https://osu.ppy.sh/b/${map.id}`)
    .setImage(map.background)
    .setDescription(description.join("\n"))
    .setFooter({ text: `Page ${page + 1}/${Math.ceil(scores.length / 5)} - Powered by YoruNoKen's osu! supporter` });
}
