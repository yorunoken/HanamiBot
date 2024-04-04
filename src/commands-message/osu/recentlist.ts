import { parseOsuArguments } from "@utils/args";
import { client } from "@utils/initalize";
import { playBuilder } from "@builders/plays";
import { Mode, PlayType } from "@type/osu";
import { UserType } from "@type/commandArgs";
import { EmbedBuilderType } from "@type/embedBuilders";
import { createActionRow, calculateButtonState } from "@utils/buttons";
import { mesageDataForButtons } from "@utils/cache";
import { EmbedType } from "lilybird";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { PlaysBuilderOptions } from "@type/embedBuilders";
import type { MessageCommand } from "@type/commands";

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

export default {
    name: "recentlist",
    aliases: Object.keys(modeAliases),
    description: "Display a list of recent play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;

async function run({ message, args, commandName, index, channel }: { message: Message, args: Array<string>, commandName: string, index: number | undefined, channel: GuildTextChannel }): Promise<void> {
    const { mode, includeFails } = modeAliases[commandName];
    const { user, mods, flags } = parseOsuArguments(message, args, mode);
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

    let page = Number(flags.p ?? flags.page) - 1 || undefined;

    if (typeof page === "undefined" && typeof index === "undefined")
        page = 0;

    const isPage = typeof page !== "undefined";
    const totalPages = Math.ceil(plays.length / 5);

    const embedOptions: PlaysBuilderOptions = {
        type: EmbedBuilderType.PLAYS,
        initiatorId: message.author.id,
        user: osuUser,
        mode: user.mode,
        isMultiple: true,
        userDb: user.userDb,
        page,
        isPage,
        index,
        mods,
        plays
    };

    const embeds = await playBuilder(embedOptions);

    const sentMessage = await channel.send({
        embeds,
        components: createActionRow({
            isPage,
            disabledStates: [
                isPage ? page === 0 : index === 0,
                calculateButtonState(false, isPage ? page ?? 0 : index ?? 0, totalPages),
                calculateButtonState(true, isPage ? page ?? 0 : index ?? 0, totalPages),
                isPage ? page === totalPages - 1 : index === totalPages - 1
            ]
        })
    });
    mesageDataForButtons.set(sentMessage.id, embedOptions);
}
