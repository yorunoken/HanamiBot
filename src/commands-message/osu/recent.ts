import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { playBuilder } from "../../embed-builders/plays";
import { Mode, PlayType } from "../../types/osu";
import { UserType } from "../../types/commandArgs";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { createActionRow, calculateButtonState } from "../../utils/buttons";
import { mesageDataForButtons } from "../../utils/cache";
import { EmbedType } from "lilybird";
import type { Message } from "@lilybird/transformers";
import type { PlaysBuilderOptions } from "../../types/embedBuilders";
import type { MessageCommand } from "../../types/commands";

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

    const osuUserRequest = await client.safeParse(client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } }));
    if (!osuUserRequest.success) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like the user **\`${user.banchoId}\`** doesn't exist! :(`
                }
            ]
        });
        return;
    }
    const osuUser = osuUserRequest.data;
    const plays = (await client.users.getUserScores(osuUser.id, PlayType.RECENT, { query: { mode, limit: 100, include_fails: includeFails } })).map((item, idx) => {
        return { ...item, position: idx + 1 };
    });

    if (plays.length === 0) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like \`${osuUser.username}\` hasn't had any recent plays in the last 24 hours!`
                }
            ]
        });
        return;
    }

    const embedOptions: PlaysBuilderOptions = {
        type: EmbedBuilderType.PLAYS,
        initiatorId: message.author.id,
        user: osuUser,
        mode: user.mode,
        plays,
        index,
        mods
    };

    const embeds = await playBuilder(embedOptions);

    const totalPages = plays.length;
    const sentMessage = await channel.send({
        embeds,
        components: createActionRow({
            isPage: false,
            disabledStates: [
                index === 0,
                calculateButtonState(false, index, totalPages),
                calculateButtonState(true, index, totalPages),
                index === totalPages - 1
            ]
        })
    });

    mesageDataForButtons.set(sentMessage.id, embedOptions);
}

export default {
    name: "recent",
    aliases: Object.keys(modeAliases),
    description: "Display recent play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
