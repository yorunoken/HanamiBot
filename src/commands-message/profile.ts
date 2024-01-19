import { parseOsuArguments } from "../utils/args";
import { sleep } from "bun";
import type { Modes } from "../types/osu";
import type { Message } from "lilybird";
import type { MessageCommand } from "@lilybird/handlers";

async function run(message: Message, args: Array<string>, meta: { alias: string }): Promise<void> {
    const argOptions = parseOsuArguments(message, args, meta.alias as Modes);
    console.log(argOptions);
    await sleep(1000);
}

export default {
    name: "profile",
    alias: ["osu", "mania", "taiko", "fruits"],
    run
} satisfies MessageCommand;
