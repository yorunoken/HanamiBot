import { beatmapBuilder } from "@builders";
import { EmbedBuilderType } from "@type/builders";
import { Mods } from "@type/command-args";
import { CommandData, MessageCommand, ApplicationCommand } from "@type/commands";
import { Mode } from "@type/osu";
import { getCommandArgs, parseOsuArguments } from "@utils/args";
import { getBeatmapIdFromContext } from "@utils/osu";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import { Mod } from "osu-web.js";

export async function runMessage({ message, channel, args }: MessageCommand) {
    const { user, mods } = parseOsuArguments(message, args, Mode.OSU);

    const beatmapId = user.beatmapId ?? (await getBeatmapIdFromContext({ message, client: message.client }));
    const embeds = await getEmbed(beatmapId, message.author.id, mods);
    await channel.send({ embeds });
}

export async function runApplication({ interaction }: ApplicationCommand) {
    await interaction.deferReply();

    const { user, mods } = getCommandArgs(interaction);

    const beatmapId = user.beatmapId ?? (await getBeatmapIdFromContext({ channelId: interaction.channelId, client: interaction.client }));
    const embeds = await getEmbed(beatmapId, interaction.member.user.id, mods);
    await interaction.editReply({ embeds });
}

async function getEmbed(beatmapId: string | number | null, authorId: string, mods: Mods) {
    if (typeof beatmapId === "undefined" || beatmapId === null) {
        return [
            {
                type: EmbedType.Rich,
                title: "Uh oh! :x:",
                description: "It seems like the beatmap ID couldn't be found :(\n",
            },
        ];
    }

    const embeds = await beatmapBuilder({
        type: EmbedBuilderType.MAP,
        initiatorId: authorId,
        beatmapId: Number(beatmapId),
        mods: (mods.name?.match(/.{1,2}/g) as Array<Mod> | null) ?? null,
    });
    return embeds;
}

export const data = {
    name: "background",
    description: "Display information of a beatmap.",
    hasPrefixVariant: true,
    application: {
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "map",
                description: "Specify a beatmap link (eg: https://osu.ppy.sh/b/72727)",
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mods",
                description: "Specify a mods combination.",
                min_length: 2,
            },
        ],
    },
    message: {
        aliases: ["map", "m"],
    },
} satisfies CommandData;
