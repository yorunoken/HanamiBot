import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { playBuilder } from "../../embed-builders/plays";
import { Mode } from "../../types/osu";
import { UserType } from "../../types/commandArgs";
import { EmbedBuilderType } from "../../types/embedBuilders";
import type { MessageCommand } from "../../types/commands";
import type { Message } from "lilybird";

const modeAliases: Record<string, { mode: Mode, includeFails: boolean }> = {
    rb: { mode: Mode.OSU, includeFails: true },
    rbt: { mode: Mode.TAIKO, includeFails: true },
    rbm: { mode: Mode.MANIA, includeFails: true },
    rbc: { mode: Mode.FRUITS, includeFails: true },
    recentbest: { mode: Mode.OSU, includeFails: true },
    recentbesttaiko: { mode: Mode.TAIKO, includeFails: true },
    recentbestmania: { mode: Mode.MANIA, includeFails: true },
    recentbestcatch: { mode: Mode.FRUITS, includeFails: true }
};

async function run({ message, args, commandName, index }: { message: Message, args: Array<string>, commandName: string, index: number | undefined }): Promise<void> {
    const channel = await message.fetchChannel();

    const { mode, includeFails } = modeAliases[commandName];
    const { user, mods, flags } = parseOsuArguments(message, args, mode);
    if (user.type === UserType.FAIL) {
        await channel.send(user.failMessage);
        return;
    }

    const osuUser = await client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } });
    if (!osuUser.id) {
        await channel.send("This user does not exist.");
        return;
    }

    const embeds = await playBuilder({
        builderType: EmbedBuilderType.PLAYS,
        user: osuUser,
        mode: user.mode,
        initiatorId: message.author.id,
        type: "best",
        includeFails,
        page: Number(flags.p ?? flags.page) || undefined,
        index,
        mods,
        isMultiple: true,
        sortByDate: true
    });
    await channel.send({ embeds });
}

export default {
    name: "recentbest",
    aliases: Object.keys(modeAliases),
    description: "Display a list of best recent play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
