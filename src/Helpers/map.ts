import { getBeatmap } from "../functions";
import { downloadMap, getIdFromContext, getMap, getUsernameFromArgs, insertData, interactionhandler } from "../utils";
import { EmbedBuilder } from "discord.js";
import { v2 } from "osu-api-extended";
import type { BeatmapInfo, ExtendedClient, Locales } from "../Structure/index";
import type { Message } from "discord.js";

export async function start({ interaction, client, args, mapId, locale }: { interaction: Message, client: ExtendedClient, args: Array<string>, mapId?: string, locale: Locales }): Promise<void> {
    const options = interactionhandler(interaction, args);

    const userOptions = getUsernameFromArgs(options.author, options.userArgs, true);
    if (!userOptions) {
        await options.reply(locale.fails.error);
        return;
    }

    if (typeof userOptions.user === "object") {
        await options.reply(userOptions.user.message);
        return;
    }

    let beatmapId = mapId ?? userOptions.beatmapId ?? await getIdFromContext(interaction, client);
    if (beatmapId === undefined || beatmapId === null) {
        await options.reply(locale.fails.noBeatmapIdInCtx);
        return;
    }
    beatmapId = +beatmapId;

    const beatmap = await v2.beatmap.id.details(beatmapId);
    if (!beatmap.id) {
        await options.reply(locale.fails.noBeatmapIdInCtx);
        return;
    }

    let file = getMap(beatmapId.toString())?.data;
    if (!file || !["ranked", "loved", "approved"].includes(beatmap.status)) {
        const value = await downloadMap(beatmapId);
        if (Array.isArray(value))
            return;

        file = value;
        insertData({ table: "maps", id: beatmapId.toString(), data: [ { name: "data", value } ] });
    }

    await options.reply({ embeds: [await buildMapEmbed(getBeatmap(beatmap, { mods: userOptions.mods?.codes ?? [""] }, file, locale), locale)] });
    return;
}

async function buildMapEmbed(map: BeatmapInfo, locale: Locales): Promise<EmbedBuilder> {
    const mapAuthor = await v2.user.details(map.creator, "osu");

    return new EmbedBuilder()
        .setTitle(`${map.artist} - ${map.title}`)
        .setURL(`https://osu.ppy.sh/b/${map.id}`)
        .setAuthor({
            name: locale.embeds.map.beatmapBy(mapAuthor.username),
            iconURL: mapAuthor.avatar_url
        })
        .setThumbnail(`https://assets.ppy.sh/beatmaps/${map.setId}/covers/list.jpg`)
        .setDescription(`${map.modeEmoji} **[${map.version}]**
${locale.embeds.map.stars}: **\`${map.stars}\`** ${locale.embeds.map.mods}: \`${
    map.mods === "+" ? "+NM" : map.mods
}\` BPM: \`${map.bpm}\`
${locale.embeds.map.length}: \`${map.mapLength}\` ${locale.embeds.map.maxCombo}: \`${map.maxCombo}\` ${locale.embeds.map.objects}: \`${map.totalObjects}\`
AR: \`${map.ar}\` OD: \`${map.od}\` CS: \`${map.cs}\` HP: \`${map.hp}\`\n\n:heart: **${map.favorited}** :play_pause: **${map.playCount}**`)
        .setFields({ name: "PP", value: map.ppValues, inline: true }, { name: locale.embeds.map.links, value: map.links, inline: true })
        .setFooter({ text: map.updatedAt });
}
