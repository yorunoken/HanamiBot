import { parseOsuArguments } from "../../utils/args";
import { profileBuilder } from "../../embed-builders/profile";
import { client } from "../../utils/initalize";
import { UserType } from "../../types/commandArgs";
import { EmbedBuilderType } from "../../types/embedBuilders";
import type { MessageCommand } from "../../types/commands";
import type { Mode } from "../../types/osu";
import type { Message } from "lilybird";

async function run({ message, args, commandName }: { message: Message, args: Array<string>, commandName: string }): Promise<void> {
    const channel = await message.fetchChannel();

    const { user } = parseOsuArguments(message, args, commandName as Mode);
    if (user.type === UserType.FAIL) {
        await channel.send(user.failMessage);
        return;
    }

    const osuUser = await client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } });
    if (!osuUser.id) {
        await channel.send("This user does not exist.");
        return;
    }

    const embeds = profileBuilder({ builderType: EmbedBuilderType.PROFILE, user: osuUser, mode: user.mode });
    await channel.send({ embeds });
}

export default {
    name: "profile",
    aliases: ["osu", "mania", "taiko", "fruits"],
    description: "Display statistics of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
