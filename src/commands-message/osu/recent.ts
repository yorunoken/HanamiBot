import { parseOsuArguments } from "../../utils/args";
import { profileBuilder } from "../../embed-builders/profile";
import { v2 } from "osu-api-extended";
import type { MessageCommand } from "../../types/commands";
import type { Modes } from "../../types/osu";
import type { Message } from "lilybird";

async function run({ message, args, commandName }: { message: Message, args: Array<string>, commandName: string }): Promise<void> {
    const channel = await message.fetchChannel();

    const { user } = parseOsuArguments(message, args, commandName as Modes);
    if (user.type === "fail") {
        await channel.send(user.failMessage);
        return;
    }

    const osuUser = await v2.user.details(user.banchoId, user.mode);
    if (!osuUser.id) {
        await channel.send("This user does not exist.");
        return;
    }

    const embed = profileBuilder(osuUser, user.mode);
    await channel.send({ embeds: [embed] });
}

const modeAliases: Record<string, { mode: Modes | "", passOnly: boolean }> = {
    r: { mode: "osu", passOnly: false },
    rs: { mode: "osu", passOnly: false },
    rt: { mode: "taiko", passOnly: false },
    rm: { mode: "mania", passOnly: false },
    rc: { mode: "fruits", passOnly: false },
    recent: { mode: "osu", passOnly: false },
    recenttaiko: { mode: "taiko", passOnly: false },
    recentmania: { mode: "mania", passOnly: false },
    recentcatch: { mode: "fruits", passOnly: false },

    rp: { mode: "osu", passOnly: true },
    rsp: { mode: "osu", passOnly: true },
    rpt: { mode: "taiko", passOnly: true },
    rpm: { mode: "mania", passOnly: true },
    rpc: { mode: "fruits", passOnly: true },
    recentpass: { mode: "osu", passOnly: true },
    recentpasstaiko: { mode: "taiko", passOnly: true },
    recentpassmania: { mode: "mania", passOnly: true },
    recentpasscatch: { mode: "fruits", passOnly: true }
};

export default {
    name: "recent",
    aliases: Object.keys(modeAliases),
    description: "Display recent play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
