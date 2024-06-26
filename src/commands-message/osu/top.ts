import { parseOsuArguments } from "@utils/args";
import { client } from "@utils/initalize";
import { playBuilder } from "@builders/plays";
import { Mode, PlayType } from "@type/osu";
import { UserType } from "@type/commandArgs";
import { EmbedBuilderType } from "@type/embedBuilders";
import { calculateButtonState, createActionRow } from "@utils/buttons";
import { mesageDataForButtons } from "@utils/cache";
import { EmbedType } from "lilybird";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { PlaysBuilderOptions } from "@type/embedBuilders";
import type { MessageCommand } from "@type/commands";

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

export default {
    name: "top",
    aliases: Object.keys(modeAliases),
    description: "Display top play(s) of a user.",
    usage: `/top
    /top mode: fruits`,
    cooldown: 1000,
    run
} satisfies MessageCommand;

async function run({ message, args, commandName, index, channel }: { message: Message, args: Array<string>, commandName: string, index: number | undefined, channel: GuildTextChannel }): Promise<void> {
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
                    description: `It seems like the user **\`${user.banchoId}\`** doesn't exist! :(`
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

    let page = Number(flags.p ?? flags.page) - 1 || undefined;

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
        authorDb: user.authorDb,
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

