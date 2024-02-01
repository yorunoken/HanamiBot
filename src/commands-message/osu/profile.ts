import { parseOsuArguments } from "../../utils/args";
import { profileBuilder } from "../../embed-builders/profile";
import { v2 } from "osu-api-extended";
import type { MessageCommand } from "../../types/commands";
import type { Modes } from "../../types/osu";
import type { Message } from "lilybird";

async function run({ message, args, commandName }: { message: Message, args: Array<string>, commandName: string }): Promise<void> {
    const channel = await message.fetchChannel();

    const { user } = parseOsuArguments(message, args, commandName as Modes);
    if (user.type === "fail") {
        await channel.send(user.failMessage);
        return;
    }

    const osuUser = await v2.user.details(user.banchoId, user.mode);
    if (!osuUser.id) {
        await channel.send("This user does not exist.");
        return;
    }

    const embed = profileBuilder(osuUser, user.mode);
    await channel.send({ embeds: [embed] });
}

export default {
    name: "profile",
    aliases: ["osu", "mania", "taiko", "fruits"],
    description: "Display statistics of a user.",
    cooldown: 1000,
    run
} satisfies MessageCommand;
