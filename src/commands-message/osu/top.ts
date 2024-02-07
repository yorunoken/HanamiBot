import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { playBuilder } from "../../embed-builders/plays";
import { Mode } from "../../types/osu";
import { UserType } from "../../types/commandArgs";
import type { MessageCommand } from "../../types/commands";
import type { Message } from "lilybird";

const modeAliases: Record<string, { mode: Mode }> = {
    top: { mode: Mode.OSU },
    toposu: { mode: Mode.OSU },
    toptaiko: { mode: Mode.TAIKO },
    topmania: { mode: Mode.MANIA },
    topcatch: { mode: Mode.FRUITS },
    topctb: { mode: Mode.FRUITS },

    t: { mode: Mode.OSU },
    to: { mode: Mode.OSU },
    tt: { mode: Mode.TAIKO },
    tm: { mode: Mode.MANIA },
    tc: { mode: Mode.FRUITS },
    tctb: { mode: Mode.FRUITS }
};

async function run({ message, args, commandName, index }: { message: Message, args: Array<string>, commandName: string, index: number | undefined }): Promise<void> {
    const channel = await message.fetchChannel();

    const { mode } = modeAliases[commandName];
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

    const embeds = await playBuilder({ user: osuUser, mode: user.mode, initiatorId: message.author.id, type: "best", page: Number(flags.p ?? flags.page) || undefined, index, mods, isMultiple: true });
    await channel.send({ embeds });
}

export default {
    name: "top",
    aliases: Object.keys(modeAliases),
    description: "Display top play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
