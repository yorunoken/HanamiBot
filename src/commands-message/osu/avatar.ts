import { parseOsuArguments } from "../../utils/args";
import { client } from "../../utils/initalize";
import { UserType } from "../../types/commandArgs";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { Mode } from "../../types/osu";
import { avatarBuilder } from "../../embed-builders/avatar";
import { EmbedType } from "lilybird";
import type { Message } from "lilybird";
import type { MessageCommand } from "../../types/commands";

export default {
    name: "avatar",
    description: "Display the profile of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;

async function run({ message, args }: { message: Message, args: Array<string> }): Promise<void> {
    const channel = await message.fetchChannel();

    const { user } = parseOsuArguments(message, args, Mode.OSU);
    if (user.type === UserType.FAIL) {
        await channel.send(user.failMessage);
        return;
    }

    const osuUser = await client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } });
    if (!osuUser.id) {
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like \`${user.banchoId}\` doesn't exist!`
                }
            ]
        });
        return;
    }

    const embeds = avatarBuilder({
        type: EmbedBuilderType.AVATAR,
        initiatorId: message.author.id,
        user: osuUser
    });
    await channel.send({ embeds });
}

