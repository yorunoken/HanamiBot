import { parseOsuArguments } from "@utils/args";
import { profileBuilder } from "@builders";
import { client } from "@utils/initalize";
import { UserType } from "@type/commandArgs";
import { EmbedBuilderType } from "@type/builders";
import { Mode } from "@type/osu";
import { EmbedType } from "lilybird";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

export default {
    name: "profile",
    aliases: ["osu", "mania", "taiko", "fruits"],
    description: "Display statistics of a user.",
    details: "You can specify the mode by using the `mod` flag in slash commands.",
    usage: "/osu",
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({ message, args, commandName, channel }: { message: Message; args: Array<string>; commandName: string; channel: GuildTextChannel }): Promise<void> {
    if (commandName === "profile") commandName = Mode.OSU;

    const { user } = parseOsuArguments(message, args, commandName as Mode);
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

    const embeds = profileBuilder({
        type: EmbedBuilderType.PROFILE,
        initiatorId: message.author.id,
        user: osuUser,
        mode: user.mode,
    });
    await channel.send({ embeds });
}
