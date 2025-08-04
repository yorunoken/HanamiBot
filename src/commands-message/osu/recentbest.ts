import { parseOsuArguments } from "@utils/args";
import { client } from "@utils/initalize";
import { playBuilder } from "@builders/plays";
import { Mode, PlayType } from "@type/osu";
import { UserType } from "@type/commandArgs";
import { EmbedBuilderType } from "@type/embedBuilders";
import { createPaginationActionRow } from "@utils/buttons";
import { ButtonStateCache } from "@utils/cache";
import { EmbedType } from "lilybird";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { PlaysBuilderOptions } from "@type/embedBuilders";
import type { MessageCommand } from "@type/commands";

const modeAliases: Record<string, { mode: Mode }> = {
    rb: { mode: Mode.OSU },
    rbt: { mode: Mode.TAIKO },
    rbm: { mode: Mode.MANIA },
    rbc: { mode: Mode.FRUITS },
    recentbest: { mode: Mode.OSU },
    recentbesttaiko: { mode: Mode.TAIKO },
    recentbestmania: { mode: Mode.MANIA },
    recentbestcatch: { mode: Mode.FRUITS },
};

export default {
    name: "recentbest",
    aliases: Object.keys(modeAliases),
    description: "Display a list of best recent play(s) of a user.",
    usage: `/recentbest
    /recentbest mods: DT
    /recentbest passes:true`,
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({ message, args, commandName, index, channel }: { message: Message; args: Array<string>; commandName: string; index: number | undefined; channel: GuildTextChannel }): Promise<void> {
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
                    description: `It seems like the user **\`${user.banchoId}\`** doesn't exist! :(`,
                },
            ],
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
                    description: `It seems like \`${osuUser.username}\` doesn't have any plays, maybe they should go set some :)`,
                },
            ],
        });
        return;
    }

    let page = Number(flags.p ?? flags.page) - 1 || undefined;

    if (typeof page === "undefined" && typeof index === "undefined") page = 0;

    const isPage = typeof page !== "undefined";

    const embedOptions: PlaysBuilderOptions = {
        type: EmbedBuilderType.PLAYS,
        initiatorId: message.author.id,
        user: osuUser,
        mode: user.mode,
        isMultiple: true,
        sortByDate: true,
        authorDb: user.authorDb,
        page,
        isPage,
        plays,
        index,
        mods,
    };

    const embeds = await playBuilder(embedOptions);

    const sentMessage = await channel.send({
        embeds,
        components: createPaginationActionRow(embedOptions),
    });
    await ButtonStateCache.set(sentMessage.id, embedOptions);
}
