import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { playBuilder } from "../../embed-builders/plays";
import { Mode, PlayType } from "../../types/osu";
import { UserType } from "../../types/commandArgs";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { calculateButtonState, createActionRow } from "../../utils/buttons";
import { mesageDataForButtons } from "../../utils/cache";
import { EmbedType } from "lilybird";
import type { Message } from "lilybird";
import type { PlaysBuilderOptions } from "../../types/embedBuilders";
import type { MessageCommand } from "../../types/commands";

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

    const osuUserRequest = await client.safeParse(client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } }));
    if (!osuUserRequest.success) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like this user doesn't exist! :(`
                }
            ]
        });
        return;
    }
    const osuUser = osuUserRequest.data;
    const plays = (await client.users.getUserScores(osuUser.id, PlayType.BEST, { query: { mode, limit: 100 } })).map((item, idx) => {
        return { ...item, position: idx + 1 };
    });

    if (plays.length === 0) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like \`${osuUser.username}\` doesn't have any plays, maybe they should go set some :)`
                }
            ]
        });
        return;
    }

    let page = Number(flags.p ?? flags.page) || undefined;

    if (typeof page === "undefined" && typeof index === "undefined")
        page = 0;

    const isPage = typeof page !== "undefined";
    const totalPages = isPage ? Math.ceil(plays.length / 5) : plays.length;

    const embedOptions: PlaysBuilderOptions = {
        type: EmbedBuilderType.PLAYS,
        initiatorId: message.author.id,
        user: osuUser,
        mode: user.mode,
        isMultiple: true,
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
                calculateButtonState(false, index ?? 0, totalPages),
                calculateButtonState(true, index ?? 0, totalPages),
                isPage ? page === totalPages - 1 : index === totalPages - 1
            ]
        })
    });
    mesageDataForButtons.set(sentMessage.id, embedOptions);
}

export default {
    name: "top",
    aliases: Object.keys(modeAliases),
    description: "Display top play(s) of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
