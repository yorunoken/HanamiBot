import { Client, EmbedBuilder, Message } from "discord.js";
import { v2 } from "osu-api-extended";
import { getBeatmap } from "../functions";
import { BeatmapInfo, Locales } from "../Structure/index";
import { downloadMap, getIdFromContext, getMap, getUsernameFromArgs, insertData, Interactionhandler } from "../utils";

export async function start({ interaction, client, args, mapId, locale }: { interaction: Message; client?: Client<boolean>; args: string[]; mapId?: string; locale: Locales }) {
  const options = Interactionhandler(interaction, args);

  const userOptions = getUsernameFromArgs(options.author, options.userArgs, true);
  if (!userOptions) {
    return options.reply(locale.fails.error);
  }
  if (userOptions.user?.status === false) {
    return options.reply(userOptions.user.message);
  }

  const beatmapId = mapId || userOptions.beatmapId || (await getIdFromContext(interaction, client!));
  if (!beatmapId) {
    return options.reply(locale.fails.noBeatmapIdInCtx);
  }
  const beatmap = await v2.beatmap.id.details(beatmapId);

  let file = getMap(beatmapId.toString())?.data;
  if (!file || !["ranked", "loved", "approved"].includes(beatmap.status)) {
    file = await downloadMap(beatmapId);
    insertData({ table: "maps", id: beatmapId.toString(), data: file });
  }

  return options.reply({ embeds: [await buildMapEmbed(await getBeatmap(beatmap, { mods: userOptions?.mods?.codes || [""] }, file, locale), locale)] });
}

async function buildMapEmbed(map: BeatmapInfo, locale: Locales) {
  const mapAuthor = await v2.user.details(map.creator, "osu");

  return new EmbedBuilder()
    .setTitle(`${map.artist} - ${map.title}`)
    .setURL(`https://osu.ppy.sh/b/${map.id}`)
    .setAuthor({
      name: locale.embeds.map.beatmapBy(mapAuthor.username),
      iconURL: mapAuthor.avatar_url,
    })
    .setThumbnail(`https://assets.ppy.sh/beatmaps/${map.setId}/covers/list.jpg`)
    .setDescription(
      `${map.modeEmoji} **[${map.version}]**\n${locale.embeds.map.stars}: **\`${map.stars}\`** ${locale.embeds.map.mods}: \`${
        map.mods === "+" ? "+NM" : map.mods
      }\` BPM: \`${map.bpm}\`\n${locale.embeds.map.length}: \`${map.mapLength}\` ${locale.embeds.map.maxCombo}: \`${map.maxCombo}\` ${locale.embeds.map.objects}: \`${map.totalObjects}\`\nAR: \`${map.ar}\` OD: \`${map.od}\` CS: \`${map.cs}\` HP: \`${map.hp}\`\n\n:heart: **${map.favorited}** :play_pause: **${map.playCount}**`,
    )
    .setFields({ name: "PP", value: map.ppValues, inline: true }, { name: locale.embeds.map.links, value: map.links, inline: true })
    .setFooter({ text: map.updatedAt });
}
