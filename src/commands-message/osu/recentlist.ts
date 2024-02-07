import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { playBuilder } from "../../embed-builders/plays";
import type { MessageCommand } from "../../types/commands";
import type { Modes } from "../../types/osu";
import type { Message } from "lilybird";

const modeAliases: Record<string, { mode: Modes, includeFails: boolean }> = {
    rl: { mode: "osu", includeFails: true },
    rlt: { mode: "taiko", includeFails: true },
    rlm: { mode: "mania", includeFails: true },
    rlc: { mode: "fruits", includeFails: true },
    recentlist: { mode: "osu", includeFails: true },
    recentlisttaiko: { mode: "taiko", includeFails: true },
    recentlistmania: { mode: "mania", includeFails: true },
    recentlistcatch: { mode: "fruits", includeFails: true },

    rlp: { mode: "osu", includeFails: false },
    rlpt: { mode: "taiko", includeFails: false },
    rlpm: { mode: "mania", includeFails: false },
    rlpc: { mode: "fruits", includeFails: false },
    recentlistpass: { mode: "osu", includeFails: false },
    recentlistpasstaiko: { mode: "taiko", includeFails: false },
    recentlistpassmania: { mode: "mania", includeFails: false },
    recentlistpasscatch: { mode: "fruits", includeFails: false }
};

async function run({ message, args, commandName, index }: { message: Message, args: Array<string>, commandName: string, index: number | undefined }): Promise<void> {
    const channel = await message.fetchChannel();

    const { mode, includeFails } = modeAliases[commandName];
    const { user, mods, flags } = parseOsuArguments(message, args, mode);
    if (user.type === "fail") {
        await channel.send(user.failMessage);
        return;
    }

    const osuUser = await client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } });
    if (!osuUser.id) {
        await channel.send("This user does not exist.");
        return;
    }

    const embeds = await playBuilder({ user: osuUser, mode: user.mode, initiatorId: message.author.id, type: "recent", includeFails, page: Number(flags.p ?? flags.page), index, mods, isMultiple: true });
    await channel.send({ embeds });
}

export default {
    name: "recentlist",
    aliases: Object.keys(modeAliases),
    description: "Display a list of recent play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
