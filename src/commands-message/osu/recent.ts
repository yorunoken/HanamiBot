import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { playBuilder } from "../../embed-builders/plays";
import { Mode } from "../../types/osu";
import { UserType } from "../../types/commandArgs";
import type { MessageCommand } from "../../types/commands";
import type { Message } from "lilybird";

const modeAliases: Record<string, { mode: Mode, includeFails: boolean }> = {
    r: { mode: Mode.OSU, includeFails: true },
    rs: { mode: Mode.OSU, includeFails: true },
    rt: { mode: Mode.TAIKO, includeFails: true },
    rm: { mode: Mode.MANIA, includeFails: true },
    rc: { mode: Mode.FRUITS, includeFails: true },
    recent: { mode: Mode.OSU, includeFails: true },
    recenttaiko: { mode: Mode.TAIKO, includeFails: true },
    recentmania: { mode: Mode.MANIA, includeFails: true },
    recentcatch: { mode: Mode.FRUITS, includeFails: true },

    rp: { mode: Mode.OSU, includeFails: false },
    rsp: { mode: Mode.OSU, includeFails: false },
    rpt: { mode: Mode.TAIKO, includeFails: false },
    rpm: { mode: Mode.MANIA, includeFails: false },
    rpc: { mode: Mode.FRUITS, includeFails: false },
    recentpass: { mode: Mode.OSU, includeFails: false },
    recentpasstaiko: { mode: Mode.TAIKO, includeFails: false },
    recentpassmania: { mode: Mode.MANIA, includeFails: false },
    recentpasscatch: { mode: Mode.FRUITS, includeFails: false }
};

async function run({ message, args, commandName, index = 0 }: { message: Message, args: Array<string>, commandName: string, index: number | undefined }): Promise<void> {
    const channel = await message.fetchChannel();

    const { mode, includeFails } = modeAliases[commandName];
    const { user, mods } = parseOsuArguments(message, args, mode);
    if (user.type === UserType.FAIL) {
        await channel.send(user.failMessage);
        return;
    }

    const osuUser = await client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } });
    if (!osuUser.id) {
        await channel.send("This user does not exist.");
        return;
    }

    const embeds = await playBuilder({ user: osuUser, mode: user.mode, initiatorId: message.author.id, type: "recent", includeFails, index, mods });
    await channel.send({ embeds });
}

export default {
    name: "recent",
    aliases: Object.keys(modeAliases),
    description: "Display recent play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
