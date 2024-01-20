import { parseOsuArguments } from "../utils/args";
import { profileBuilder } from "../embed-builders/profile";
import { v2 } from "osu-api-extended";
import type { Modes } from "../types/osu";
import type { Message } from "lilybird";
import type { MessageCommand } from "@lilybird/handlers";

async function run(message: Message, args: Array<string>, meta: { alias: string }): Promise<void> {
    const channel = await message.fetchChannel();

    const { user } = parseOsuArguments(message, args, meta.alias as Modes);
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
    alias: ["osu", "mania", "taiko", "fruits"],
    run
} satisfies MessageCommand;
