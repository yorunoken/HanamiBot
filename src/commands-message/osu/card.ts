import { parseOsuArguments } from "@utils/args";
import { client } from "@utils/initalize";
import { UserType } from "@type/commandArgs";
import { EmbedBuilderType } from "@type/embedBuilders";
import { cardBuilder } from "@builders/card";
import { Mode } from "@type/osu";
import { EmbedType } from "lilybird";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

export default {
    name: "card",
    aliases: ["card", "cards", "stats"],
    description: "Display card of a user.",
    usage: "/card",
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({
    message,
    args,
    channel,
}: {
    message: Message;
    args: Array<string>;
    commandName: string;
    channel: GuildTextChannel;
}): Promise<void> {
    const { user } = parseOsuArguments(message, args, <Mode>Mode.OSU);
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

    const options = await cardBuilder({
        type: EmbedBuilderType.CARD,
        initiatorId: message.author.id,
        user: osuUser,
    });
    await channel.send(options);
}
