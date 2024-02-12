import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { playBuilder } from "../../embed-builders/plays";
import { Mode } from "../../types/osu";
import { UserType } from "../../types/commandArgs";
import { EmbedBuilderType } from "../../types/embedBuilders";
import type { MessageCommand } from "../../types/commands";
import type { Message } from "lilybird";

const modeAliases: Record<string, { mode: Mode, includeFails: boolean }> = {
    rl: { mode: Mode.OSU, includeFails: true },
    rlt: { mode: Mode.TAIKO, includeFails: true },
    rlm: { mode: Mode.MANIA, includeFails: true },
    rlc: { mode: Mode.FRUITS, includeFails: true },
    recentlist: { mode: Mode.OSU, includeFails: true },
    recentlisttaiko: { mode: Mode.TAIKO, includeFails: true },
    recentlistmania: { mode: Mode.MANIA, includeFails: true },
    recentlistcatch: { mode: Mode.FRUITS, includeFails: true },

    rlp: { mode: Mode.OSU, includeFails: false },
    rlpt: { mode: Mode.TAIKO, includeFails: false },
    rlpm: { mode: Mode.MANIA, includeFails: false },
    rlpc: { mode: Mode.FRUITS, includeFails: false },
    recentlistpass: { mode: Mode.OSU, includeFails: false },
    recentlistpasstaiko: { mode: Mode.TAIKO, includeFails: false },
    recentlistpassmania: { mode: Mode.MANIA, includeFails: false },
    recentlistpasscatch: { mode: Mode.FRUITS, includeFails: false }
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
        type: "recent",
        includeFails,
        page: Number(flags.p ?? flags.page) || undefined,
        index,
        mods,
        isMultiple: true
    });
    await channel.send({ embeds });
}

export default {
    name: "recentlist",
    aliases: Object.keys(modeAliases),
    description: "Display a list of recent play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
