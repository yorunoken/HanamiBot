import { parseOsuArguments } from "@utils/args";
import { getBeatmapIdFromContext } from "@utils/osu";
import { Mode } from "@type/osu";
import { EmbedBuilderType } from "@type/embedBuilders";
import { simulateBuilder } from "@builders/simulate";
import { EmbedType } from "lilybird";
import type { DifficultyOptions } from "@type/commandArgs";
import type { Mod } from "osu-web.js";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

export default {
    name: "simulate",
    aliases: ["simulate", "sim", "s"],
    description: "Display statistics of a beatmap.",
    usage: "/simulate acc: 97 bpm: 230 combo: 900 misses: 7",
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({ message, args, channel }: { message: Message; args: Array<string>; channel: GuildTextChannel }): Promise<void> {
    const { user, mods, flags } = parseOsuArguments(message, args, Mode.OSU);

    const options: DifficultyOptions = {
        acc: Number(flags.acc ?? flags.accuracy) || undefined,
        bpm: Number(flags.bpm) || undefined,
        clock_rate: Number(flags.clockrate ?? flags.clockRate ?? flags.clock_rate ?? flags.cr) || undefined,
        combo: Number(flags.combo) || undefined,
        ar: Number(flags.ar) || undefined,
        cs: Number(flags.cs) || undefined,
        od: Number(flags.od) || undefined,
        n300: Number(flags.n300 ?? flags["300"]) || undefined,
        n100: Number(flags.n100 ?? flags["100"]) || undefined,
        n50: Number(flags.n50 ?? flags["50"]) || undefined,
        ngeki: Number(flags.ngeki ?? flags.geki) || undefined,
        nkatu: Number(flags.natu ?? flags.katu) || undefined,
        nmisses: Number(flags.nmisses ?? flags.misses ?? flags.miss ?? flags.nmiss) || undefined,
    };

    const beatmapId = user.beatmapId ?? (await getBeatmapIdFromContext({ message, client: message.client }));
    if (typeof beatmapId === "undefined" || beatmapId === null) {
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

    const embeds = await simulateBuilder({
        type: EmbedBuilderType.SIMULATE,
        initiatorId: message.author.id,
        beatmapId: Number(beatmapId),
        options,
        mods: (mods.name?.match(/.{1,2}/g) as Array<Mod> | null) ?? null,
    });
    await channel.send({ embeds });
}
