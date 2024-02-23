import { parseOsuArguments } from "../../utils/args";
import { profileBuilder } from "../../embed-builders/profile";
import { client } from "../../utils/initalize";
import { UserType } from "../../types/commandArgs";
import { EmbedBuilderType } from "../../types/embedBuilders";
import { Mode } from "../../types/osu";
import { EmbedType } from "lilybird";
import type { Message } from "lilybird";
import type { MessageCommand } from "../../types/commands";

export default {
    name: "profile",
    aliases: ["osu", "mania", "taiko", "fruits"],
    description: "Display statistics of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;

async function run({ message, args, commandName }: { message: Message, args: Array<string>, commandName: string }): Promise<void> {
    const channel = await message.fetchChannel();

    if (commandName === "profile")
        commandName = Mode.OSU;

    const { user } = parseOsuArguments(message, args, <Mode>commandName);
    if (user.type === UserType.FAIL) {
        await channel.send(user.failMessage);
        return;
    }

    const osuUserRequest = await client.safeParse(client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } }));
    if (!osuUserRequest.success) {
        console.log(osuUserRequest);
        await channel.send({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: "It seems like this user doesn't exist! :("
                }
            ]
        });
        return;
    }
    const osuUser = osuUserRequest.data;

    const embeds = profileBuilder({
        type: EmbedBuilderType.PROFILE,
        initiatorId: message.author.id,
        user: osuUser,
        mode: user.mode
    });
    await channel.send({ embeds });
}

