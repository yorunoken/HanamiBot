import { parseOsuArguments } from "../utils/args";
import { sleep } from "bun";
import type { Message } from "lilybird";
import type { MessageCommand } from "@lilybird/handlers";

async function run(message: Message, args: Array<string>, alias: { alias: string }): Promise<void> {
    const argOptions = parseOsuArguments(args);
    console.log(argOptions);
    console.log(alias);
    await sleep(1000);
}

export default {
    name: "profile",
    alias: ["osu", "mania", "taiko", "ctb"],
    run
} satisfies MessageCommand;
