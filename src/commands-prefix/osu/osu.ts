import type { PrefixCommand } from "types/commands/interfaces";
import { applicationCommandsIds } from "utils/load-commands";

export default {
    data: {
        name: "osu",
        aliases: ["osu", "mania", "taiko", "mania", "profile"],
        cooldownMs: 1000,
    },

    info: {
        description: "Display statistics of user.",
        smallDescription: "Display statistics of user.",
        howToUse: "[PREFIX]osu [username]",
        usageExample: "[PREFIX]osu yorunoken",
        category: "osu",
    },

    exec: async ({ message }) => {},
} satisfies PrefixCommand;
