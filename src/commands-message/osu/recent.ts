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

export default {
    name: "recent",
    aliases: Object.keys(modeAliases),
    description: "Display recent play(s) of a user.",
    details: `The aliases are split between includes fails, and not includes fails.
    \`r\`, \`rs\`, \rt\`, \`rm\`, \`rc\`, \`recent\`, \`recenttaiko\`, \`recentmania\` and \`recentcatch\` include fails, the rest do not.
    You can use the \`passes\` argument in slash commands to specify passes.`,
    usage: `/recent
    /recent mods: DT
    /recent passes:true`,
    cooldown: 1000,
    run
} satisfies MessageCommand;

async function run({ message, args, commandName, index = 0, channel }: { message: Message, args: Array<string>, commandName: string, index: number | undefined, channel: GuildTextChannel }): Promise<void> {
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
        authorDb: user.authorDb,
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

