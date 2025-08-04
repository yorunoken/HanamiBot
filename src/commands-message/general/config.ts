import type { MessageCommand } from "@type/commands";
import { slashCommandIdsCache } from "@utils/redis";

export default {
    name: "config",
    description: "Changes the config files of the user",
    details: `score_embeds: Use this argument to change the size of your embeds.
    mode: Change your default osu! mode. This will make it so when you use osu-related commands, it will default to your mode.
    embed_type: Hanami has an amazing feature where you can pick the embeds of other bots. Give it a try!`,
    usage: `/config score_embeds: Maximized
    /config mode: osu`,
    cooldown: 1000,
    run: async ({ message }) => {
        const configCommandId = slashCommandIdsCache.get("config");
        const commandMention = configCommandId ?? "/config";
        await message.reply(`This command has been deprecated. Use ${commandMention} instead.`);
    },
} satisfies MessageCommand;
