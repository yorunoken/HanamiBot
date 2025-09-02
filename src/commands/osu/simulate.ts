import { simulateBuilder } from "@builders";
import { MessageReplyOptions } from "@lilybird/transformers";
import { EmbedBuilderType } from "@type/builders";
import { CommandData, MessageCommand, ApplicationCommand } from "@type/commands";
import { Mode } from "@type/osu";
import { getCommandArgs, parseOsuArguments } from "@utils/args";
import { getBeatmapIdFromContext } from "@utils/osu";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";

export async function runMessage({ message, args, channel }: MessageCommand) {
    const { user, mods, flags } = parseOsuArguments(message, args, Mode.OSU);

    const beatmapId = user.beatmapId ?? (await getBeatmapIdFromContext({ message, client: message.client }));
    if (!beatmapId) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: "It seems like the beatmap ID couldn't be found :(\n",
                },
            ],
        });
        return;
    }

    const simulationOptions = {
        mods: mods.name,
        combo: Number(flags.combo) || undefined,
        accuracy: Number(flags.acc || flags.accuracy) || undefined,
        clockRate: Number(flags.clock_rate || flags.clockrate) || undefined,
        bpm: Number(flags.bpm) || undefined,
        // Add other simulation parameters from flags
    };

    const reply = await getEmbeds(String(beatmapId), message.author.id, simulationOptions);
    await channel.send(reply);
}

export async function runApplication({ interaction }: ApplicationCommand) {
    await interaction.deferReply();

    const { user } = getCommandArgs(interaction);

    const beatmapId = user.beatmapId ?? (await getBeatmapIdFromContext({ channelId: interaction.channelId, client: interaction.client }));
    if (!beatmapId) {
        await interaction.editReply({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: "It seems like the beatmap ID couldn't be found :(\n",
                },
            ],
        });
        return;
    }

    const simulationOptions = {
        mods: interaction.data.getString("mods"),
        combo: interaction.data.getNumber("combo") || undefined,
        accuracy: interaction.data.getNumber("acc") || undefined,
        clockRate: interaction.data.getNumber("clock_rate") || undefined,
        bpm: interaction.data.getNumber("bpm") || undefined,
        // Add other simulation parameters
    };

    const reply = await getEmbeds(String(beatmapId), interaction.member.user.id, simulationOptions);
    await interaction.editReply(reply);
}

async function getEmbeds(beatmapId: string, authorId: string, simulationOptions: any): Promise<MessageReplyOptions> {
    const embeds = await simulateBuilder({
        type: EmbedBuilderType.SIMULATE,
        initiatorId: authorId,
        beatmapId: Number(beatmapId),
        ...simulationOptions,
    });

    return { embeds };
}

export const data = {
    name: "simulate",
    description: "Simulate a score on a beatmap.",
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
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mode",
                description: "Specify a gamemode.",
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "combo",
                description: "Specify a combo.",
                min_value: 0,
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "acc",
                description: "Specify an accuracy.",
                min_value: 0,
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "clock_rate",
                description: "Specify a custom clockrate that overwrites any other rate changes.",
            },
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "bpm",
                description: "Specify a custom BPM.",
            },
        ],
    },
    message: {
        aliases: ["s", "sim"],
    },
} satisfies CommandData;
