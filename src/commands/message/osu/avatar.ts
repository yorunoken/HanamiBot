import { parseOsuArguments } from "@utils/args";
import { client } from "@utils/initalize";
import { UserType } from "@type/commandArgs";
import { EmbedBuilderType } from "@type/builders";
import { Mode } from "@type/osu";
import { avatarBuilder } from "@builders/index";
import { EmbedType } from "lilybird";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

export default {
    name: "avatar",
    description: "Display the profile of a user.",
    usage: "/avatar",
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({ message, args, channel }: { message: Message; args: Array<string>; channel: GuildTextChannel }): Promise<void> {
    const { user } = parseOsuArguments(message, args, Mode.OSU);
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

    const embeds = avatarBuilder({
        type: EmbedBuilderType.AVATAR,
        initiatorId: message.author.id,
        user: osuUser,
    });
    await channel.send({ embeds });
}
