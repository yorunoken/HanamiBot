import { parseOsuArguments } from "../utils/args";
import type { Message } from "lilybird";
import type { MessageCommand } from "@lilybird/handlers";

async function run(message: Message, args: Array<string>): Promise<void> {
    const argOptions = parseOsuArguments(args);
}

export default {
    name: "profile",
    alias: ["osu", "mania", "taiko", "ctb"],
    run
} satisfies MessageCommand;
