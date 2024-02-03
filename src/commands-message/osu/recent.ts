import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { playBuilder } from "../../embed-builders/plays";
import type { MessageCommand } from "../../types/commands";
import type { Modes } from "../../types/osu";
import type { Message } from "lilybird";

const modeAliases: Record<string, { mode: Modes, includeFails: boolean }> = {
    r: { mode: "osu", includeFails: true },
    rs: { mode: "osu", includeFails: true },
    rt: { mode: "taiko", includeFails: true },
    rm: { mode: "mania", includeFails: true },
    rc: { mode: "fruits", includeFails: true },
    recent: { mode: "osu", includeFails: true },
    recenttaiko: { mode: "taiko", includeFails: true },
    recentmania: { mode: "mania", includeFails: true },
    recentcatch: { mode: "fruits", includeFails: true },

    rp: { mode: "osu", includeFails: false },
    rsp: { mode: "osu", includeFails: false },
    rpt: { mode: "taiko", includeFails: false },
    rpm: { mode: "mania", includeFails: false },
    rpc: { mode: "fruits", includeFails: false },
    recentpass: { mode: "osu", includeFails: false },
    recentpasstaiko: { mode: "taiko", includeFails: false },
    recentpassmania: { mode: "mania", includeFails: false },
    recentpasscatch: { mode: "fruits", includeFails: false }
};

async function run({ message, args, commandName, index = 0 }: { message: Message, args: Array<string>, commandName: string, index: number | undefined }): Promise<void> {
    const channel = await message.fetchChannel();

    const { mode, includeFails } = modeAliases[commandName];
    const { user, mods } = parseOsuArguments(message, args, mode);
    if (user.type === "fail") {
        await channel.send(user.failMessage);
        return;
    }

    const osuUser = await client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } });
    if (!osuUser.id) {
        await channel.send("This user does not exist.");
        return;
    }

    const embed = await playBuilder({ user: osuUser, mode: user.mode, type: "recent", includeFails, index, mods });
    await channel.send({ embeds: [embed] });
}

export default {
    name: "recent",
    aliases: Object.keys(modeAliases),
    description: "Display recent play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
